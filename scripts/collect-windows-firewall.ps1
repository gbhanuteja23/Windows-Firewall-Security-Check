<#
.SYNOPSIS
    Exports active Windows Firewall configuration and security policies for auditing.
.DESCRIPTION
    Extracts Domain, Private, and Public profile settings and active firewall rules,
    then either sends them directly to the running Docker backend API (http://localhost:8080)
    or saves them to a timestamped JSON file.
.EXAMPLE
    .\collect-windows-firewall.ps1 -Upload
    .\collect-windows-firewall.ps1 -OutputFile my_firewall.json
#>

[CmdletBinding()]
param(
    [string]$ApiUrl = "http://localhost:8080/api/audit/scan",
    [switch]$Upload = $false,
    [string]$OutputFile = "windows_firewall_export.json"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Windows Firewall Security Audit Data Collector" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check for Administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "Running in non-elevated mode. Some rules and profile settings may require Administrator privileges."
}

try {
    Write-Host "[*] Querying Windows Firewall Profiles..." -ForegroundColor Yellow
    $profiles = @{}
    Get-NetFirewallProfile | ForEach-Object {
        $pName = $_.Name
        $profiles[$pName] = @{
            name = $pName
            enabled = [bool]$_.Enabled
            default_inbound_action = $_.DefaultInboundAction.ToString()
            default_outbound_action = $_.DefaultOutboundAction.ToString()
            logging_dropped = [bool]$_.LogDroppedPackets
            logging_allowed = [bool]$_.LogAllowedConnections
            log_file_path = $_.LogFileName
        }
    }

    Write-Host "[*] Querying Active Inbound and Outbound Rules..." -ForegroundColor Yellow
    $rawRules = Get-NetFirewallRule -PolicyStore ActiveStore -ErrorAction SilentlyContinue | Select-Object -First 250

    $rulesList = [System.Collections.Generic.List[PSObject]]::new()

    foreach ($r in $rawRules) {
        $portFilter = $r | Get-NetFirewallPortFilter -ErrorAction SilentlyContinue
        $addrFilter = $r | Get-NetFirewallAddressFilter -ErrorAction SilentlyContinue
        $appFilter = $r | Get-NetFirewallApplicationFilter -ErrorAction SilentlyContinue
        $svcFilter = $r | Get-NetFirewallServiceFilter -ErrorAction SilentlyContinue

        $localPorts = if ($portFilter.LocalPort) { $portFilter.LocalPort } else { @("Any") }
        $remotePorts = if ($portFilter.RemotePort) { $portFilter.RemotePort } else { @("Any") }
        $remoteAddresses = if ($addrFilter.RemoteAddress) { $addrFilter.RemoteAddress } else { @("Any") }
        $localAddresses = if ($addrFilter.LocalAddress) { $addrFilter.LocalAddress } else { @("Any") }
        $protocol = if ($portFilter.Protocol) { $portFilter.Protocol } else { "Any" }

        $ruleObj = [PSCustomObject]@{
            id = $r.InstanceID
            name = $r.Name
            display_name = if ($r.DisplayName) { $r.DisplayName } else { $r.Name }
            description = $r.Description
            direction = $r.Direction.ToString()
            action = $r.Action.ToString()
            enabled = [bool]$r.Enabled
            profiles = @($r.Profile.ToString().Split(',') | ForEach-Object { $_.Trim() })
            protocol = $protocol
            local_ports = @($localPorts)
            remote_ports = @($remotePorts)
            local_addresses = @($localAddresses)
            remote_addresses = @($remoteAddresses)
            program = $appFilter.Program
            service = $svcFilter.Service
            edge_traversal = [bool]$r.EdgeTraversalPolicy
        }
        $rulesList.Add($ruleObj)
    }

    $osCaption = (Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue).Caption
    if (-not $osCaption) { $osCaption = [System.Environment]::OSVersion.VersionString }

    $payload = [PSCustomObject]@{
        host_name = [System.Environment]::MachineName
        os_version = $osCaption
        profiles = $profiles
        rules = $rulesList
    }

    $json = $payload | ConvertTo-Json -Depth 5

    # Save to file
    $json | Out-File -FilePath $OutputFile -Encoding utf8
    Write-Host "[+] Successfully saved firewall export to: $OutputFile" -ForegroundColor Green

    # Optional Upload directly to backend API
    if ($Upload) {
        Write-Host "[*] Uploading export directly to Security Backend ($ApiUrl)..." -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri $ApiUrl -Method Post -Body $json -ContentType "application/json"
        Write-Host "[+] Audit Complete! Overall Score: $($response.score.overall)/100 (Grade: $($response.score.grade))" -ForegroundColor Green
        Write-Host "[+] Open http://localhost:8080 in Chrome to view the interactive dashboard." -ForegroundColor Cyan
    }

} catch {
    Write-Error "Failed to export Windows Firewall data: $_"
}
