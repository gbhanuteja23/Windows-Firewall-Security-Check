import uuid
from datetime import datetime
from typing import Dict, List, Tuple
from app.models.firewall import (
    FirewallProfile,
    FirewallRule,
    SecurityVulnerability,
    AuditReport,
    ScoreBreakdown,
    AuditSummary,
    SeverityEnum,
    ActionEnum,
    DirectionEnum,
)

DANGEROUS_PORTS = {
    "445": {
        "name": "SMB (Server Message Block)",
        "severity": SeverityEnum.CRITICAL,
        "impact": "Exposes host to ransomware propagation (e.g., WannaCry, EternalBlue) and remote code execution.",
        "rec": "Block inbound SMB port 445 on all public networks. Restrict to internal management subnets.",
    },
    "3389": {
        "name": "RDP (Remote Desktop Protocol)",
        "severity": SeverityEnum.CRITICAL,
        "impact": "Primary vector for brute-force attacks, credential stuffing, and unauthorized remote graphical access.",
        "rec": "Disable public inbound RDP. Require VPN or restrict to authorized IP ranges with NLA enabled.",
    },
    "23": {
        "name": "Telnet",
        "severity": SeverityEnum.CRITICAL,
        "impact": "Transmits plaintext credentials over the wire, susceptible to packet sniffing and man-in-the-middle attacks.",
        "rec": "Completely disable Telnet service and remove inbound firewall exceptions. Use SSH or WinRM over HTTPS.",
    },
    "135": {
        "name": "RPC Endpoint Mapper",
        "severity": SeverityEnum.HIGH,
        "impact": "Used in enumeration and exploit chains (DCOM, relay attacks) against Windows hosts.",
        "rec": "Block port 135 inbound from public and untrusted network segments.",
    },
    "137": {
        "name": "NetBIOS Name Service",
        "severity": SeverityEnum.HIGH,
        "impact": "Vulnerable to NetBIOS spoofing, LLMNR poisoning, and reconnaissance.",
        "rec": "Disable NetBIOS over TCP/IP and block inbound UDP port 137.",
    },
    "138": {
        "name": "NetBIOS Datagram Service",
        "severity": SeverityEnum.HIGH,
        "impact": "Allows network scanning and information leakage.",
        "rec": "Block inbound UDP port 138 on non-domain interfaces.",
    },
    "139": {
        "name": "NetBIOS Session Service",
        "severity": SeverityEnum.HIGH,
        "impact": "Legacy file sharing vector susceptible to null session enumeration.",
        "rec": "Block inbound TCP port 139.",
    },
    "21": {
        "name": "FTP (File Transfer Protocol)",
        "severity": SeverityEnum.HIGH,
        "impact": "Plaintext authentication and unencrypted file transmission.",
        "rec": "Replace with SFTP/FTPS and block standard port 21 inbound.",
    },
    "5900": {
        "name": "VNC Remote Desktop",
        "severity": SeverityEnum.HIGH,
        "impact": "Frequently targeted by brute force and automated screen capturing exploits.",
        "rec": "Do not expose VNC directly. Tunnel over SSH or VPN.",
    },
    "5985": {
        "name": "WinRM HTTP (Unencrypted)",
        "severity": SeverityEnum.HIGH,
        "impact": "Remote PowerShell management over unencrypted HTTP protocol.",
        "rec": "Enforce WinRM over HTTPS (Port 5986) with certificate authentication.",
    },
    "1433": {
        "name": "Microsoft SQL Server",
        "severity": SeverityEnum.CRITICAL,
        "impact": "Direct database exposure susceptible to SQL injection probes and brute-force SA attacks.",
        "rec": "Isolate database to localhost or private backend VLAN. Never allow public inbound.",
    },
    "3306": {
        "name": "MySQL Server",
        "severity": SeverityEnum.CRITICAL,
        "impact": "Public database exposure risking credential brute-force and data exfiltration.",
        "rec": "Bind to localhost/private socket and remove public inbound firewall rule.",
    },
    "5432": {
        "name": "PostgreSQL Server",
        "severity": SeverityEnum.HIGH,
        "impact": "Database port exposed to unauthorized network entities.",
        "rec": "Restrict inbound traffic to trusted application server IP addresses.",
    },
    "6379": {
        "name": "Redis In-Memory Store",
        "severity": SeverityEnum.CRITICAL,
        "impact": "Unprotected Redis instances allow unauthenticated remote command execution via cron/ssh key injection.",
        "rec": "Never expose Redis publicly. Bind to 127.0.0.1 or use strict ACLs.",
    },
    "27017": {
        "name": "MongoDB Server",
        "severity": SeverityEnum.HIGH,
        "impact": "Risk of unauthenticated NoSQL database dumping and ransomware locking.",
        "rec": "Restrict inbound connections to application servers only.",
    },
    "22": {
        "name": "SSH",
        "severity": SeverityEnum.MEDIUM,
        "impact": "Subject to continuous automated brute-force attacks if exposed to 0.0.0.0/0.",
        "rec": "Restrict inbound SSH to specific administrator CIDRs or VPN gateway.",
    },
}


def analyze_firewall_configuration(
    profiles: Dict[str, FirewallProfile],
    rules: List[FirewallRule],
    host_name: str = "WINDOWS-HOST",
    os_version: str = "Windows 11 / Server 2022",
    preset_name: str = "Live Scan",
) -> AuditReport:
    vulnerabilities: List[SecurityVulnerability] = []
    recommendations: List[str] = []

    profile_score = 100
    port_score = 100
    hygiene_score = 100
    logging_score = 100

    # 1. Profile Security Evaluation
    required_profiles = ["Domain", "Private", "Public"]
    for p_name in required_profiles:
        profile = profiles.get(p_name)
        if not profile:
            profile_score -= 25
            vulnerabilities.append(
                SecurityVulnerability(
                    id=f"VULN-PROF-MISSING-{p_name.upper()}",
                    title=f"Missing Profile Configuration: {p_name}",
                    severity=SeverityEnum.CRITICAL,
                    category="Profile Hardening",
                    description=f"The {p_name} firewall profile state is missing or unmanaged.",
                    impact=f"Network traffic under the {p_name} interface may be completely unprotected.",
                    recommendation=f"Enable the {p_name} profile with default block inbound action.",
                    remediation_cmd_ps=f"Set-NetFirewallProfile -Profile {p_name} -Enabled True -DefaultInboundAction Block",
                    remediation_cmd_netsh=f"netsh advfirewall set {p_name.lower()}profile state on",
                )
            )
            continue

        if not profile.enabled:
            profile_score -= 30
            vulnerabilities.append(
                SecurityVulnerability(
                    id=f"VULN-PROF-DISABLED-{p_name.upper()}",
                    title=f"Firewall Profile Disabled: {p_name}",
                    severity=SeverityEnum.CRITICAL,
                    category="Profile Hardening",
                    description=f"Windows Firewall is completely turned OFF for the {p_name} profile.",
                    impact="Zero perimeter filtering on this network profile. Attackers can connect to any listening socket.",
                    recommendation=f"Turn ON Windows Firewall for the {p_name} profile immediately.",
                    remediation_cmd_ps=f"Set-NetFirewallProfile -Profile {p_name} -Enabled True",
                    remediation_cmd_netsh=f"netsh advfirewall set {p_name.lower()}profile state on",
                )
            )

        if profile.default_inbound_action != ActionEnum.BLOCK:
            profile_score -= 35
            vulnerabilities.append(
                SecurityVulnerability(
                    id=f"VULN-PROF-INBOUND-ALLOW-{p_name.upper()}",
                    title=f"Default Inbound Action is ALLOW ({p_name})",
                    severity=SeverityEnum.CRITICAL,
                    category="Profile Hardening",
                    description=f"The {p_name} profile is set to permit inbound connections by default without explicit allow rules.",
                    impact="Violates the principle of default deny. Any unmapped port is accessible to external callers.",
                    recommendation=f"Set default inbound behavior to Block for {p_name}.",
                    remediation_cmd_ps=f"Set-NetFirewallProfile -Profile {p_name} -DefaultInboundAction Block",
                    remediation_cmd_netsh=f"netsh advfirewall set {p_name.lower()}profile firewallpolicy blockinbound,allowoutbound",
                )
            )

        # Logging audit
        if not profile.logging_dropped:
            logging_score -= 15
            vulnerabilities.append(
                SecurityVulnerability(
                    id=f"VULN-PROF-LOG-DROPPED-{p_name.upper()}",
                    title=f"Dropped Packet Logging Disabled ({p_name})",
                    severity=SeverityEnum.LOW,
                    category="Logging & Telemetry",
                    description=f"The {p_name} profile does not log blocked/dropped packets.",
                    impact="Lack of forensic evidence during active port scans, password spraying, or network intrusion attempts.",
                    recommendation="Enable dropped packet logging to '%SystemRoot%\\System32\\LogFiles\\Firewall\\pfirewall.log'.",
                    remediation_cmd_ps=f"Set-NetFirewallProfile -Profile {p_name} -LogDroppedPackets True",
                    remediation_cmd_netsh=f"netsh advfirewall set {p_name.lower()}profile logging droppedconnections enable",
                )
            )

    # 2. Rule Evaluation
    evaluated_rules: List[FirewallRule] = []
    inbound_allow_count = 0
    outbound_allow_count = 0
    wildcard_rules_count = 0

    for rule in rules:
        r_reasons: List[str] = []
        r_severity = SeverityEnum.INFO
        is_crit = False

        if rule.action == ActionEnum.ALLOW:
            if rule.direction == DirectionEnum.INBOUND:
                inbound_allow_count += 1
            else:
                outbound_allow_count += 1

        if rule.enabled and rule.action == ActionEnum.ALLOW and rule.direction == DirectionEnum.INBOUND:
            is_any_remote = any(addr.lower() in ["any", "0.0.0.0/0", "*", "internet"] for addr in rule.remote_addresses)
            is_public_profile = "Public" in rule.profiles or "Any" in rule.profiles

            # Wildcard "Any to Any" Check
            is_any_protocol = rule.protocol.lower() in ["any", "*"]
            is_any_port = any(p.lower() in ["any", "*"] for p in rule.local_ports)
            if is_any_protocol and is_any_port and is_any_remote:
                wildcard_rules_count += 1
                r_severity = SeverityEnum.CRITICAL
                is_crit = True
                hygiene_score -= 25
                r_reasons.append("Wildcard Inbound Allow: Permits ANY protocol and port from ANY remote address.")
                vulnerabilities.append(
                    SecurityVulnerability(
                        id=f"VULN-RULE-WILDCARD-{rule.id}",
                        rule_id=rule.id,
                        title=f"Wildcard Inbound Allow Rule: '{rule.display_name}'",
                        severity=SeverityEnum.CRITICAL,
                        category="Rule Hygiene",
                        description=f"Rule '{rule.display_name}' allows inbound connections for all protocols and ports without IP restrictions.",
                        impact="Completely circumvents firewall boundary protections for listening services.",
                        recommendation=f"Delete or disable rule '{rule.name}' or constrain to explicit application and subnet.",
                        remediation_cmd_ps=f"Get-NetFirewallRule -DisplayName '{rule.display_name}' -ErrorAction SilentlyContinue | Disable-NetFirewallRule",
                        remediation_cmd_netsh=f"netsh advfirewall firewall set rule name='{rule.display_name}' new enable=no",
                    )
                )

            # Check for Dangerous Ports
            for port in rule.local_ports:
                clean_port = port.split("/")[0].strip()
                if clean_port in DANGEROUS_PORTS:
                    port_info = DANGEROUS_PORTS[clean_port]
                    port_name = port_info["name"]
                    p_sev = port_info["severity"]

                    if is_any_remote and is_public_profile:
                        if p_sev == SeverityEnum.CRITICAL:
                            port_score -= 20
                            is_crit = True
                            r_severity = SeverityEnum.CRITICAL
                        elif p_sev == SeverityEnum.HIGH:
                            port_score -= 10
                            if r_severity != SeverityEnum.CRITICAL:
                                r_severity = SeverityEnum.HIGH
                        else:
                            port_score -= 5
                            if r_severity not in [SeverityEnum.CRITICAL, SeverityEnum.HIGH]:
                                r_severity = SeverityEnum.MEDIUM

                        r_reasons.append(f"Exposes high-risk service '{port_name}' (Port {clean_port}) to Public/Any remote IP.")
                        vulnerabilities.append(
                            SecurityVulnerability(
                                id=f"VULN-PORT-{clean_port}-{rule.id}",
                                rule_id=rule.id,
                                title=f"Exposed High-Risk Port {clean_port} ({port_name})",
                                severity=p_sev,
                                category="Port Exposure",
                                description=f"Rule '{rule.display_name}' allows inbound traffic on port {clean_port} ({port_name}) from unrestricted remote addresses.",
                                impact=port_info["impact"],
                                recommendation=port_info["rec"],
                                remediation_cmd_ps=f"Get-NetFirewallRule -DisplayName '{rule.display_name}' -ErrorAction SilentlyContinue | Disable-NetFirewallRule",
                                remediation_cmd_netsh=f"netsh advfirewall firewall set rule name='{rule.display_name}' new enable=no",
                            )
                        )
                    elif is_any_remote:
                        # On Domain/Private profiles
                        port_score -= 5
                        if r_severity == SeverityEnum.INFO:
                            r_severity = SeverityEnum.MEDIUM
                        r_reasons.append(f"Inbound port {clean_port} ({port_name}) allowed across local subnets.")

            # Edge Traversal risk
            if rule.edge_traversal and is_any_remote:
                hygiene_score -= 10
                r_reasons.append("Edge Traversal is enabled; allows unsolicited inbound NAT-traversed traffic.")
                vulnerabilities.append(
                    SecurityVulnerability(
                        id=f"VULN-EDGE-TRAV-{rule.id}",
                        rule_id=rule.id,
                        title=f"Edge Traversal Enabled on '{rule.display_name}'",
                        severity=SeverityEnum.MEDIUM,
                        category="Rule Hygiene",
                        description=f"Rule '{rule.display_name}' has Edge Traversal explicitly enabled for inbound traffic.",
                        impact="Packets can bypass perimeter NAT routers directly to the host using Teredo tunneling.",
                        recommendation="Disable Edge Traversal unless explicitly required by an enterprise gateway.",
                        remediation_cmd_ps=f"Get-NetFirewallRule -DisplayName '{rule.display_name}' -ErrorAction SilentlyContinue | Set-NetFirewallRule -EdgeTraversalPolicy Block",
                        remediation_cmd_netsh=f"netsh advfirewall firewall set rule name='{rule.display_name}' new edge=no",
                    )
                )

        rule.risk_level = r_severity
        rule.is_critical_risk = is_crit
        rule.risk_reasons = r_reasons
        evaluated_rules.append(rule)

    # Normalize scores between 0 and 100
    profile_score = max(0, min(100, profile_score))
    port_score = max(0, min(100, port_score))
    hygiene_score = max(0, min(100, hygiene_score))
    logging_score = max(0, min(100, logging_score))

    # Overall calculation: Profile (35%), Ports (35%), Hygiene (15%), Logging (15%)
    overall = int(
        (0.35 * profile_score)
        + (0.35 * port_score)
        + (0.15 * hygiene_score)
        + (0.15 * logging_score)
    )

    grade = "A"
    if overall < 60:
        grade = "F"
    elif overall < 70:
        grade = "D"
    elif overall < 80:
        grade = "C"
    elif overall < 90:
        grade = "B"
    elif overall >= 95:
        grade = "A+"

    # Tally counts
    crit_count = sum(1 for v in vulnerabilities if v.severity == SeverityEnum.CRITICAL)
    high_count = sum(1 for v in vulnerabilities if v.severity == SeverityEnum.HIGH)
    med_count = sum(1 for v in vulnerabilities if v.severity == SeverityEnum.MEDIUM)
    low_count = sum(1 for v in vulnerabilities if v.severity == SeverityEnum.LOW)

    # General Recommendations
    if crit_count > 0:
        recommendations.append(f"Execute remediation script to resolve {crit_count} Critical vulnerabilities immediately.")
    if any(p.default_inbound_action != ActionEnum.BLOCK for p in profiles.values()):
        recommendations.append("Enforce 'Default Inbound Action: Block' across all profiles (Domain, Private, Public).")
    if wildcard_rules_count > 0:
        recommendations.append(f"Remove or restrict {wildcard_rules_count} wildcard Any-to-Any inbound firewall rules.")
    if logging_score < 80:
        recommendations.append("Configure logging for dropped packets on all profiles for incident response visibility.")
    if not recommendations:
        recommendations.append("Host configuration conforms to CIS Windows Firewall Hardening standards.")

    summary = AuditSummary(
        total_rules=len(rules),
        enabled_rules=sum(1 for r in rules if r.enabled),
        inbound_allow_rules=inbound_allow_count,
        outbound_allow_rules=outbound_allow_count,
        critical_findings_count=crit_count,
        high_findings_count=high_count,
        medium_findings_count=med_count,
        low_findings_count=low_count,
        total_vulnerabilities=len(vulnerabilities),
    )

    scores = ScoreBreakdown(
        profile_hardening=profile_score,
        port_exposure=port_score,
        rule_hygiene=hygiene_score,
        logging_telemetry=logging_score,
        overall=overall,
        grade=grade,
    )

    return AuditReport(
        id=str(uuid.uuid4())[:8],
        timestamp=datetime.utcnow().isoformat() + "Z",
        host_name=host_name,
        os_version=os_version,
        score=scores,
        summary=summary,
        profiles=profiles,
        vulnerabilities=sorted(
            vulnerabilities,
            key=lambda x: (
                0 if x.severity == SeverityEnum.CRITICAL else
                1 if x.severity == SeverityEnum.HIGH else
                2 if x.severity == SeverityEnum.MEDIUM else 3
            )
        ),
        rules=evaluated_rules,
        recommendations=recommendations,
        preset_name=preset_name,
    )
