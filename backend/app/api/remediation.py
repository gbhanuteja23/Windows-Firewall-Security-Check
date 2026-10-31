from fastapi import APIRouter
from fastapi.responses import PlainTextResponse
from app.api.audit import get_or_create_current_audit

router = APIRouter(prefix="/api/remediation", tags=["Remediation & Export"])


@router.get("/powershell", response_class=PlainTextResponse)
def get_powershell_remediation_script():
    """Generate an automated Windows PowerShell hardening script based on identified vulnerabilities."""
    audit = get_or_create_current_audit()

    lines = [
        "# ===================================================================",
        "# WINDOWS FIREWALL SECURITY HARDENING SCRIPT",
        f"# Generated: {audit.timestamp}",
        f"# Target Host: {audit.host_name} ({audit.os_version})",
        f"# Audit Score: {audit.score.overall}/100 (Grade: {audit.score.grade})",
        f"# Total Vulnerabilities Identified: {audit.summary.total_vulnerabilities}",
        "# Run this script in an Elevated PowerShell Prompt (Run as Administrator)",
        "# ===================================================================",
        "",
        "$ErrorActionPreference = 'Stop'",
        "Write-Host '[*] Initiating Windows Firewall Hardening...' -ForegroundColor Cyan",
        "",
        "# Step 1: Ensure Windows Firewall Service (MpsSvc) is running",
        "Set-Service -Name MpsSvc -StartupType Automatic",
        "Start-Service -Name MpsSvc -ErrorAction SilentlyContinue",
        "",
        "# Step 2: Remediate Identified Profile Weaknesses",
    ]

    for vuln in audit.vulnerabilities:
        if vuln.category == "Profile Hardening":
            lines.append(f"# {vuln.title}")
            lines.append(f"Write-Host '[+] Applying: {vuln.title}' -ForegroundColor Yellow")
            lines.append(vuln.remediation_cmd_ps)
            lines.append("")

    lines.extend([
        "# Step 3: Remediate High-Risk Rules & Dangerous Port Exposures",
    ])

    for vuln in audit.vulnerabilities:
        if vuln.category in ["Port Exposure", "Rule Hygiene"]:
            lines.append(f"# {vuln.title}")
            lines.append(f"Write-Host '[+] Remediating: {vuln.title}' -ForegroundColor Yellow")
            lines.append(f"try {{ {vuln.remediation_cmd_ps} }} catch {{ Write-Warning $_.Exception.Message }}")
            lines.append("")

    lines.extend([
        "# Step 4: Configure Logging for Incident Response Telemetry",
    ])
    for vuln in audit.vulnerabilities:
        if vuln.category == "Logging & Telemetry":
            lines.append(f"# {vuln.title}")
            lines.append(vuln.remediation_cmd_ps)

    lines.extend([
        "",
        "Write-Host '=====================================================' -ForegroundColor Green",
        "Write-Host '[SUCCESS] Windows Firewall Hardening Completed!' -ForegroundColor Green",
        "Write-Host '=====================================================' -ForegroundColor Green",
    ])

    return "\n".join(lines)


@router.get("/netsh", response_class=PlainTextResponse)
def get_netsh_remediation_script():
    """Generate a Windows Command Prompt (cmd.exe / netsh) remediation batch script."""
    audit = get_or_create_current_audit()

    lines = [
        "@echo off",
        "rem ===================================================================",
        "rem WINDOWS FIREWALL HARDENING BATCH SCRIPT (NETSH)",
        f"rem Generated: {audit.timestamp}",
        f"rem Audit Score: {audit.score.overall}/100 (Grade: {audit.score.grade})",
        "rem Requires Administrative Privileges",
        "rem ===================================================================",
        "",
        "echo [*] Applying Windows Firewall hardening rules...",
        "",
    ]

    for vuln in audit.vulnerabilities:
        lines.append(f"rem {vuln.title}")
        lines.append(vuln.remediation_cmd_netsh)
        lines.append("")

    lines.extend([
        "echo [*] All netsh firewall hardening policies applied successfully.",
        "pause",
    ])

    return "\n".join(lines)


@router.get("/report/markdown", response_class=PlainTextResponse)
def get_markdown_report():
    """Generate a comprehensive Markdown executive security audit report."""
    audit = get_or_create_current_audit()

    lines = [
        "# Windows Firewall Security Assessment Report",
        "",
        f"- **Assessment Timestamp**: `{audit.timestamp}`",
        f"- **Target Host**: `{audit.host_name}`",
        f"- **Operating System**: `{audit.os_version}`",
        f"- **Overall Security Score**: **{audit.score.overall}/100** (`Grade: {audit.score.grade}`)",
        f"- **Preset / Profile Source**: `{audit.preset_name}`",
        "",
        "---",
        "",
        "## Executive Score Breakdown",
        "",
        "| Category | Score | Status |",
        "| :--- | :---: | :--- |",
        f"| Profile Hardening | `{audit.score.profile_hardening}/100` | {'Pass' if audit.score.profile_hardening >= 80 else 'Attention Needed'} |",
        f"| Port Exposure | `{audit.score.port_exposure}/100` | {'Pass' if audit.score.port_exposure >= 80 else 'Attention Needed'} |",
        f"| Rule Hygiene | `{audit.score.rule_hygiene}/100` | {'Pass' if audit.score.rule_hygiene >= 80 else 'Attention Needed'} |",
        f"| Logging & Telemetry | `{audit.score.logging_telemetry}/100` | {'Pass' if audit.score.logging_telemetry >= 80 else 'Attention Needed'} |",
        f"| **Overall Compliance** | **`{audit.score.overall}/100`** | **Grade {audit.score.grade}** |",
        "",
        "## Summary Metrics",
        "",
        f"- **Total Rules Analyzed**: {audit.summary.total_rules}",
        f"- **Active Inbound Allow Rules**: {audit.summary.inbound_allow_rules}",
        f"- **Active Outbound Allow Rules**: {audit.summary.outbound_allow_rules}",
        f"- **Critical Vulnerabilities**: {audit.summary.critical_findings_count}",
        f"- **High Severity Findings**: {audit.summary.high_findings_count}",
        f"- **Medium Severity Findings**: {audit.summary.medium_findings_count}",
        f"- **Low Severity Findings**: {audit.summary.low_findings_count}",
        "",
        "## Profile Status Overview",
        "",
        "| Profile | Enabled | Default Inbound | Default Outbound | Dropped Logged | Allowed Logged |",
        "| :--- | :---: | :---: | :---: | :---: | :---: |",
    ]

    for p_name, p in audit.profiles.items():
        lines.append(
            f"| **{p_name}** | {'Yes' if p.enabled else 'NO (Disabled)'} | "
            f"`{p.default_inbound_action}` | `{p.default_outbound_action}` | "
            f"{'Yes' if p.logging_dropped else 'No'} | {'Yes' if p.logging_allowed else 'No'} |"
        )

    lines.extend([
        "",
        "## Security Findings & Vulnerabilities",
        "",
    ])

    if not audit.vulnerabilities:
        lines.append("_No vulnerabilities detected. Firewall configuration conforms to CIS hardening benchmarks._\n")
    else:
        for idx, v in enumerate(audit.vulnerabilities, 1):
            lines.extend([
                f"### {idx}. [{v.severity.upper()}] {v.title}",
                f"- **Category**: `{v.category}`",
                f"- **Description**: {v.description}",
                f"- **Impact**: {v.impact}",
                f"- **Recommendation**: {v.recommendation}",
                "- **Remediation PowerShell Command**:",
                f"  ```powershell\n  {v.remediation_cmd_ps}\n  ```",
                "",
            ])

    lines.extend([
        "## Strategic Recommendations",
        "",
    ])
    for rec in audit.recommendations:
        lines.append(f"- {rec}")

    return "\n".join(lines)
