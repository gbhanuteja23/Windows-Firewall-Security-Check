from typing import Dict
from fastapi import APIRouter
from app.models.firewall import FirewallProfile
from app.api.audit import get_or_create_current_audit

router = APIRouter(prefix="/api/profiles", tags=["Firewall Profiles"])


@router.get("", response_model=Dict[str, FirewallProfile])
def get_profiles():
    """Get the current configuration of Domain, Private, and Public firewall profiles."""
    audit = get_or_create_current_audit()
    return audit.profiles
