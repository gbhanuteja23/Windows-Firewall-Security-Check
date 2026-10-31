<#
.SYNOPSIS
    Automates building, launching the Docker container on WSL2 Ubuntu 22.04 on fixed port 8080,
    and opens the Windows Firewall Security Check app in Google Chrome.
.DESCRIPTION
    1. Verifies Docker daemon readiness.
    2. Builds the container image 'windows-firewall-security-check' if needed.
    3. Starts the container on fixed port 8080.
    4. Waits for healthcheck probe on http://localhost:8080/api/health.
    5. Opens Google Chrome to http://localhost:8080.
#>

$ErrorActionPreference = 'Stop'
$FixedPort = 8090
$ContainerName = "windows-firewall-backend"
$ImageName = "windows-firewall-security-check:latest"
$AppUrl = "http://localhost:$FixedPort"

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  WINDOWS FIREWALL SECURITY CHECK - LAUNCHER" -ForegroundColor Cyan
Write-Host "  Target Port: $FixedPort | Host: WSL 2 Ubuntu 22.04 Docker" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Verify Docker CLI is accessible
Write-Host "[*] Checking Docker availability..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "[+] Docker detected: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Error "Docker is not running or not in PATH. Please start Docker Desktop or the WSL2 Docker daemon."
    exit 1
}

# 2. Check if container is already running
Write-Host "[*] Checking existing container '$ContainerName'..." -ForegroundColor Yellow
$existingContainer = docker ps -a --filter "name=^/${ContainerName}$" --format "{{.Status}}"

if ($existingContainer -match "Up") {
    Write-Host "[+] Container '$ContainerName' is already running on port $FixedPort." -ForegroundColor Green
} else {
    if ($existingContainer) {
        Write-Host "[*] Starting existing stopped container '$ContainerName'..." -ForegroundColor Yellow
        docker start $ContainerName | Out-Null
    } else {
        # Check if image exists, build if missing
        $imageExists = docker images -q $ImageName
        if (-not $imageExists) {
            Write-Host "[*] Building Docker image '$ImageName' (Ubuntu 22.04 backend + React)..." -ForegroundColor Yellow
            $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
            $repoRoot = Split-Path -Parent $scriptDir
            docker build -t $ImageName -f "$repoRoot/Dockerfile" "$repoRoot"
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Docker build failed."
                exit 1
            }
        }

        Write-Host "[*] Starting new container '$ContainerName' on port $FixedPort..." -ForegroundColor Yellow
        docker run -d --name $ContainerName -p "${FixedPort}:8080" --restart unless-stopped $ImageName | Out-Null
    }
}

# 3. Wait for service readiness
Write-Host "[*] Waiting for backend readiness at $AppUrl/api/health..." -ForegroundColor Yellow
$maxRetries = 25
$retry = 0
$ready = $false

while ($retry -lt $maxRetries -and -not $ready) {
    Start-Sleep -Seconds 1
    try {
        $res = Invoke-RestMethod -Uri "$AppUrl/api/health" -TimeoutSec 2 -ErrorAction Stop
        if ($res.status -eq "healthy") {
            $ready = $true
            Write-Host "[+] Backend is HEALTHY on port $FixedPort!" -ForegroundColor Green
            Write-Host "    App: $($res.app_name) v$($res.version)" -ForegroundColor Cyan
            Write-Host "    Runtime: $($res.runtime_environment)" -ForegroundColor Cyan
        }
    } catch {
        $retry++
        Write-Host "    Waiting for container init ($retry/$maxRetries)..." -ForegroundColor Gray
    }
}

if (-not $ready) {
    Write-Warning "Backend took longer than expected to initialize. Check logs with: docker logs $ContainerName"
}

# 4. Launch Chrome
Write-Host "[*] Launching Google Chrome to $AppUrl..." -ForegroundColor Yellow

$chromePaths = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
)

$chromeLaunched = $false
foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        Start-Process -FilePath $path -ArgumentList $AppUrl
        $chromeLaunched = $true
        Write-Host "[+] Launched Chrome: $path" -ForegroundColor Green
        break
    }
}

if (-not $chromeLaunched) {
    try {
        Start-Process "chrome" -ArgumentList $AppUrl -ErrorAction Stop
        Write-Host "[+] Launched Chrome via PATH." -ForegroundColor Green
    } catch {
        Write-Host "[*] Chrome not found in standard paths; opening default system browser..." -ForegroundColor Yellow
        Start-Process $AppUrl
    }
}

Write-Host "==================================================================" -ForegroundColor Green
Write-Host " [SUCCESS] Windows Firewall Security Check is open at:" -ForegroundColor Green
Write-Host "           $AppUrl" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Green
