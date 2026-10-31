from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class DirectionEnum(str, Enum):
    INBOUND = "Inbound"
    OUTBOUND = "Outbound"


class ActionEnum(str, Enum):
    ALLOW = "Allow"
    BLOCK = "Block"


class SeverityEnum(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    INFO = "Info"


class FirewallProfile(BaseModel):
    name: str = Field(..., description="Domain, Private, or Public")
    enabled: bool = True
    default_inbound_action: ActionEnum = ActionEnum.BLOCK
    default_outbound_action: ActionEnum = ActionEnum.ALLOW
    allow_inbound_rules: bool = True
    notifications_disabled: bool = False
    logging_allowed: bool = False
    logging_dropped: bool = True
    log_file_path: Optional[str] = "%SystemRoot%\\System32\\LogFiles\\Firewall\\pfirewall.log"
    log_file_size_limit_kb: int = 4096


class FirewallRule(BaseModel):
    id: str
    name: str
    display_name: str
    description: Optional[str] = ""
    direction: DirectionEnum = DirectionEnum.INBOUND
    action: ActionEnum = ActionEnum.ALLOW
    enabled: bool = True
    profiles: List[str] = ["Any"]
    protocol: str = "TCP"
    local_ports: List[str] = ["Any"]
    remote_ports: List[str] = ["Any"]
    local_addresses: List[str] = ["Any"]
    remote_addresses: List[str] = ["Any"]
    program: Optional[str] = "Any"
    service: Optional[str] = "Any"
    group: Optional[str] = ""
    edge_traversal: bool = False
    is_critical_risk: bool = False
    risk_level: SeverityEnum = SeverityEnum.INFO
    risk_reasons: List[str] = []


class SecurityVulnerability(BaseModel):
    id: str
    rule_id: Optional[str] = None
    title: str
    severity: SeverityEnum
    category: str  # Profile Hardening, Port Exposure, Rule Hygiene, Logging
    description: str
    impact: str
    recommendation: str
    remediation_cmd_ps: str
    remediation_cmd_netsh: str


class ScoreBreakdown(BaseModel):
    profile_hardening: int = 100
    port_exposure: int = 100
    rule_hygiene: int = 100
    logging_telemetry: int = 100
    overall: int = 100
    grade: str = "A"


class AuditSummary(BaseModel):
    total_rules: int
    enabled_rules: int
    inbound_allow_rules: int
    outbound_allow_rules: int
    critical_findings_count: int
    high_findings_count: int
    medium_findings_count: int
    low_findings_count: int
    total_vulnerabilities: int


class AuditReport(BaseModel):
    id: str
    timestamp: str
    host_name: str
    os_version: str
    scanner_version: str = "1.0.0"
    score: ScoreBreakdown
    summary: AuditSummary
    profiles: Dict[str, FirewallProfile]
    vulnerabilities: List[SecurityVulnerability]
    rules: List[FirewallRule]
    recommendations: List[str]
    preset_name: Optional[str] = None
