// In dev with Vite proxy, requests to /api route to port 8080.
// In production served by FastAPI on port 8080, requests to /api are direct.
const API_BASE = '';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchAuditReport() {
  const res = await fetch(`${API_BASE}/api/audit`);
  if (!res.ok) throw new Error(`Failed to fetch audit: ${res.statusText}`);
  return res.json();
}

export async function loadAuditPreset(presetId) {
  const res = await fetch(`${API_BASE}/api/audit/presets/${presetId}`);
  if (!res.ok) throw new Error(`Failed to load preset ${presetId}: ${res.statusText}`);
  return res.json();
}

export async function scanFirewallData(data) {
  const res = await fetch(`${API_BASE}/api/audit/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to ingest scan data: ${res.statusText}`);
  return res.json();
}

export async function fetchPowerShellRemediation() {
  const res = await fetch(`${API_BASE}/api/remediation/powershell`);
  if (!res.ok) throw new Error(`Failed to fetch PowerShell script: ${res.statusText}`);
  return res.text();
}

export async function fetchNetshRemediation() {
  const res = await fetch(`${API_BASE}/api/remediation/netsh`);
  if (!res.ok) throw new Error(`Failed to fetch Netsh script: ${res.statusText}`);
  return res.text();
}

export async function fetchMarkdownReport() {
  const res = await fetch(`${API_BASE}/api/remediation/report/markdown`);
  if (!res.ok) throw new Error(`Failed to fetch Markdown report: ${res.statusText}`);
  return res.text();
}
