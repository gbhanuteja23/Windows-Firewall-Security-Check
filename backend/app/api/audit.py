from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Body
from app.models.firewall import AuditReport
from app.core.analyzer import analyze_firewall_configuration
from app.core.sample_data import (
    get_standard_workstation_data,
    get_vulnerable_server_data,
    get_cis_hardened_data,
)
from app.models.firewall import FirewallProfile, FirewallRule

router = APIRouter(prefix="/api/audit", tags=["Security Audit"])

# In-memory storage for current audit state
_CURRENT_AUDIT: Optional[AuditReport] = None


def get_or_create_current_audit() -> AuditReport:
    global _CURRENT_AUDIT
    if _CURRENT_AUDIT is None:
        profiles, rules = get_standard_workstation_data()
        _CURRENT_AUDIT = analyze_firewall_configuration(
            profiles=profiles,
            rules=rules,
            preset_name="Standard Workstation",
        )
    return _CURRENT_AUDIT


@router.get("", response_model=AuditReport)
def get_audit_report():
    """Retrieve the latest comprehensive Windows Firewall security audit report."""
    return get_or_create_current_audit()


@router.get("/presets/{preset_id}", response_model=AuditReport)
def load_preset(preset_id: str):
    """Load a predefined Windows Firewall configuration benchmark."""
    global _CURRENT_AUDIT
    preset_id = preset_id.lower()

    if preset_id == "standard":
        profiles, rules = get_standard_workstation_data()
        _CURRENT_AUDIT = analyze_firewall_configuration(
            profiles=profiles,
            rules=rules,
            preset_name="Standard Workstation (Typical)",
        )
    elif preset_id == "vulnerable":
        profiles, rules = get_vulnerable_server_data()
        _CURRENT_AUDIT = analyze_firewall_configuration(
            profiles=profiles,
            rules=rules,
            preset_name="Vulnerable Server (High Risk)",
        )
    elif preset_id in ["hardened", "cis"]:
        profiles, rules = get_cis_hardened_data()
        _CURRENT_AUDIT = analyze_firewall_configuration(
            profiles=profiles,
            rules=rules,
            preset_name="CIS Benchmark Hardened",
        )
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Preset '{preset_id}' not found. Available presets: standard, vulnerable, hardened",
        )

    return _CURRENT_AUDIT


@router.post("/scan", response_model=AuditReport)
def scan_custom_firewall_data(payload: Dict[str, Any] = Body(...)):
    """
    Ingest exported Windows Firewall JSON (e.g. from Get-NetFirewallRule & Get-NetFirewallProfile)
    and perform an immediate security audit.
    """
    global _CURRENT_AUDIT

    raw_profiles = payload.get("profiles", {})
    raw_rules = payload.get("rules", [])
    host_name = payload.get("host_name", "WINDOWS-HOST")
    os_version = payload.get("os_version", "Windows 11 / Server")

    # If payload is just a list of rules
    if isinstance(payload, list):
        raw_rules = payload
        raw_profiles = {}

    parsed_profiles: Dict[str, FirewallProfile] = {}
    if isinstance(raw_profiles, dict) and raw_profiles:
        for name, p_data in raw_profiles.items():
            try:
                parsed_profiles[name] = FirewallProfile(
                    name=p_data.get("name", name),
                    enabled=bool(p_data.get("enabled", True)),
                    default_inbound_action=p_data.get("default_inbound_action", "Block"),
                    default_outbound_action=p_data.get("default_outbound_action", "Allow"),
                    logging_dropped=bool(p_data.get("logging_dropped", False)),
                    logging_allowed=bool(p_data.get("logging_allowed", False)),
                )
            except Exception:
                continue

    if not parsed_profiles:
        # Default standard profiles if none provided in scan
        default_prof, _ = get_standard_workstation_data()
        parsed_profiles = default_prof

    parsed_rules: list[FirewallRule] = []
    for idx, r in enumerate(raw_rules):
        try:
            r_name = str(r.get("name") or r.get("Name") or f"Rule-{idx+1}")
            disp_name = str(r.get("display_name") or r.get("DisplayName") or r_name)
            direction = str(r.get("direction") or r.get("Direction") or "Inbound").capitalize()
            action = str(r.get("action") or r.get("Action") or "Allow").capitalize()
            enabled = bool(r.get("enabled", r.get("Enabled", True)))

            # Ports
            lp = r.get("local_ports") or r.get("LocalPort") or ["Any"]
            if isinstance(lp, str):
                lp = [p.strip() for p in lp.split(",")]

            rp = r.get("remote_ports") or r.get("RemotePort") or ["Any"]
            if isinstance(rp, str):
                rp = [p.strip() for p in rp.split(",")]

            # Remote addresses
            ra = r.get("remote_addresses") or r.get("RemoteAddress") or ["Any"]
            if isinstance(ra, str):
                ra = [a.strip() for a in ra.split(",")]

            # Profiles
            profs = r.get("profiles") or r.get("Profile") or ["Any"]
            if isinstance(profs, str):
                profs = [p.strip() for p in profs.split(",")]

            parsed_rules.append(
                FirewallRule(
                    id=str(r.get("id", f"rule-{idx+1}")),
                    name=r_name,
                    display_name=disp_name,
                    description=r.get("description", r.get("Description", "")),
                    direction=direction if direction in ["Inbound", "Outbound"] else "Inbound",
                    action=action if action in ["Allow", "Block"] else "Allow",
                    enabled=enabled,
                    profiles=profs,
                    protocol=str(r.get("protocol") or r.get("Protocol") or "TCP"),
                    local_ports=lp,
                    remote_ports=rp,
                    remote_addresses=ra,
                    program=str(r.get("program") or r.get("Program") or "Any"),
                    service=str(r.get("service") or r.get("Service") or "Any"),
                )
            )
        except Exception:
            continue

    _CURRENT_AUDIT = analyze_firewall_configuration(
        profiles=parsed_profiles,
        rules=parsed_rules,
        host_name=host_name,
        os_version=os_version,
        preset_name="Custom Ingested Scan",
    )

    return _CURRENT_AUDIT
