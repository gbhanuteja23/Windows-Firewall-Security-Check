from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from app.models.firewall import FirewallRule, SeverityEnum, DirectionEnum, ActionEnum
from app.api.audit import get_or_create_current_audit

router = APIRouter(prefix="/api/rules", tags=["Firewall Rules"])


@router.get("", response_model=List[FirewallRule])
def list_rules(
    direction: Optional[DirectionEnum] = None,
    action: Optional[ActionEnum] = None,
    profile: Optional[str] = None,
    enabled_only: Optional[bool] = None,
    risk_level: Optional[SeverityEnum] = None,
    search: Optional[str] = None,
):
    """Retrieve and filter parsed Windows Firewall rules from the latest audit."""
    audit = get_or_create_current_audit()
    results = audit.rules

    if direction is not None:
        results = [r for r in results if r.direction == direction]

    if action is not None:
        results = [r for r in results if r.action == action]

    if profile:
        profile_lower = profile.lower()
        results = [
            r for r in results
            if any(p.lower() == profile_lower or p.lower() == "any" for p in r.profiles)
        ]

    if enabled_only is True:
        results = [r for r in results if r.enabled]

    if risk_level is not None:
        results = [r for r in results if r.risk_level == risk_level]

    if search:
        s = search.lower()
        results = [
            r for r in results
            if s in r.name.lower()
            or s in r.display_name.lower()
            or any(s in p.lower() for p in r.local_ports)
            or s in r.protocol.lower()
            or (r.program and s in r.program.lower())
            or (r.service and s in r.service.lower())
        ]

    return results


@router.get("/{rule_id}", response_model=FirewallRule)
def get_rule_detail(rule_id: str):
    """Get complete inspection details for a single firewall rule."""
    audit = get_or_create_current_audit()
    for r in audit.rules:
        if r.id == rule_id or r.name == rule_id:
            return r
    raise HTTPException(status_code=404, detail=f"Rule with id '{rule_id}' not found.")
