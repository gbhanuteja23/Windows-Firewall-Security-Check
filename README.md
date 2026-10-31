# 🛡️ Windows Firewall Security Check

A modern, containerized Cybersecurity & SecOps auditing dashboard for **Windows Defender Firewall with Advanced Security**.

The backend runs inside an **Ubuntu 22.04 LTS Docker container on WSL 2**, exposing a high-performance REST API and serving the React frontend on a **fixed port: `8080`**.

---

## 🚀 Quick Start (1-Click Automation)

You can launch the entire stack—build the container, start the backend on port 8080, verify health, and automatically launch Google Chrome—with a single script:

### Option A: Windows Batch File (Double-Click)
Double-click or run from Command Prompt:
```cmd
scripts\run-firewall-check.bat
```

### Option B: Windows PowerShell Script
Run from PowerShell (Run as Administrator for full host inspection):
```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-firewall-check.ps1
```

Both scripts automatically:
1. Verify the Docker daemon is running on WSL 2.
2. Build the Ubuntu 22.04 container image `windows-firewall-security-check:latest`.
3. Start the container `windows-firewall-backend` bound to **fixed port `8080`**.
4. Poll `http://localhost:8080/api/health` until healthy.
5. Automatically open **Google Chrome** to `http://localhost:8080`.

---

## 🐳 Manual Container Management

If you prefer to start and control the Docker container manually using the command line:

### 1. Build the Docker Image
From the repository root on WSL 2 Ubuntu:
```bash
docker build -t windows-firewall-security-check:latest .
```

### 2. Start the Backend Container
Run the container in detached mode on the fixed port `8080`:
```bash
docker run -d \
  --name windows-firewall-backend \
  -p 8080:8080 \
  --restart unless-stopped \
  windows-firewall-security-check:latest
```

*(Alternatively, run using Docker Compose: `docker compose up -d`)*

### 3. Verify Container Health
Check container status:
```bash
docker ps --filter "name=windows-firewall-backend"
```
Or query the healthcheck endpoint:
```bash
curl http://localhost:8080/api/health
```
Expected output:
```json
{
  "status": "healthy",
  "app_name": "Windows Firewall Security Check API",
  "version": "1.0.0",
  "runtime_environment": "WSL 2 Ubuntu 22.04 Docker",
  "port": 8080,
  "os": "Ubuntu 22.04 LTS (WSL 2 Host)"
}
```

### 4. Open in Browser
Open Google Chrome and navigate to:
```
http://localhost:8080
```

### 5. Stop or Restart Container
- **View logs**: `docker logs -f windows-firewall-backend`
- **Stop container**: `docker stop windows-firewall-backend`
- **Restart container**: `docker start windows-firewall-backend`
- **Remove container**: `docker rm -f windows-firewall-backend`

---

## 🔍 Features & Architecture

### 1. Security Compliance & Risk Scoring (0–100)
- **Profile Hardening (35% weight)**: Ensures Domain, Private, and Public profiles are active with `Default Inbound Action: Block`.
- **Port Exposure & Attack Surface (35% weight)**: Scans for inbound exposures on high-risk ports:
  - **SMB (445)** & **NetBIOS (137–139)**: WannaCry / EternalBlue / lateral movement risks.
  - **RDP (3389)**: Remote desktop brute-force and credential stuffing.
  - **Telnet (23)** & **FTP (21)**: Plaintext transmission risks.
  - **Databases (MSSQL 1433, MySQL 3306, Postgres 5432, Redis 6379, MongoDB 27017)**.
  - **Remote Management (WinRM 5985, VNC 5900, SSH 22)**.
- **Rule Hygiene (15% weight)**: Detects dangerous `Any-to-Any` wildcard rules, perimeter bypasses, and edge traversal leaks.
- **Logging & Telemetry (15% weight)**: Verifies that dropped packet logging is configured for SIEM and forensic investigation.

### 2. Interactive Rule Explorer
- Search rules by display name, service, port, application, or protocol.
- Filter by direction (Inbound/Outbound), action (Allow/Block), profile, and risk level.
- Deep-dive inspection modal showing full application bindings and PowerShell diagnostic commands.

### 3. Automated 1-Click Remediation Generator
- Generates hardened Windows PowerShell scripts (`.ps1`) and Netsh batch scripts (`.bat`) targeting only the identified vulnerabilities.
- Copy individual commands with 1-click or download the full automated script.

### 4. Live Windows Host Data Collector
To audit your current Windows machine:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\collect-windows-firewall.ps1 -Upload
```
This queries active rules and profile states, exports `windows_firewall_export.json`, and uploads it directly to the dashboard at `http://localhost:8080`.

---

## 📁 Repository Structure

```
1-Windows-Firewall-Security-Check/
├── Dockerfile                         # Ubuntu 22.04 LTS backend container definition
├── docker-compose.yml                 # Docker Compose orchestrator (Port 8080)
├── .dockerignore
├── .gitignore
├── README.md                          # Comprehensive documentation
├── backend/
│   ├── Dockerfile                     # Standalone backend Dockerfile
│   ├── requirements.txt               # FastAPI, Uvicorn, Pydantic dependencies
│   └── app/
│       ├── __init__.py
│       ├── main.py                    # FastAPI application & SPA static server
│       ├── api/
│       │   ├── audit.py               # Audit endpoints, presets, custom scans
│       │   ├── rules.py               # Rule listing and detailed queries
│       │   ├── profiles.py            # Firewall profile endpoints
│       │   ├── remediation.py         # PowerShell, Netsh, & Markdown generators
│       │   └── health.py              # Health check probe
│       ├── core/
│       │   ├── analyzer.py            # Security scoring & vulnerability engine
│       │   ├── config.py              # Fixed port (8080) & runtime configuration
│       │   └── sample_data.py         # Standard, Vulnerable, and CIS Hardened presets
│       ├── models/
│       │   └── firewall.py            # Pydantic data schemas
│       └── dist/                      # Production React SPA build
├── frontend/
│   ├── package.json                   # React 18, Vite, Lucide Icons, Tailwind CSS
│   ├── vite.config.js                 # Dev proxy configuration
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx                    # Root Dashboard layout & state
│       ├── main.jsx                   # React DOM root
│       ├── index.css                  # Tailwind styles & cyber theme
│       ├── components/
│       │   ├── Navbar.jsx             # Top bar, status badge, preset selector
│       │   ├── SecurityScoreCard.jsx  # Circular score gauge & dimension bars
│       │   ├── ProfileStatusGrid.jsx  # Domain, Private, Public cards
│       │   ├── VulnerabilityAlerts.jsx# Alert feed with 1-click copy remediation
│       │   ├── RuleExplorer.jsx       # Searchable, filterable rule table
│       │   ├── RuleDetailModal.jsx    # Technical inspection modal
│       │   ├── RemediationModal.jsx   # PowerShell & Netsh script viewer
│       │   ├── AuditUploadModal.jsx   # Import Windows host JSON
│       │   └── ExportReportModal.jsx  # Executive report export
│       └── services/
│           └── api.js                 # REST API client
└── scripts/
    ├── run-firewall-check.bat         # 1-Click Windows batch launcher
    ├── run-firewall-check.ps1         # 1-Click Windows PowerShell launcher
    ├── collect-windows-firewall.ps1   # PowerShell data collector for Windows hosts
    └── start-wsl-backend.sh           # Direct WSL 2 shell starter
```

---

## 📖 API Documentation

Once the container is running on port 8080, interactive Swagger API documentation is available at:
- **Interactive Swagger UI**: [http://localhost:8080/docs](http://localhost:8080/docs)
- **ReDoc UI**: [http://localhost:8080/redoc](http://localhost:8080/redoc)

Key Endpoints:
- `GET /api/health`: System health probe and runtime telemetry.
- `GET /api/audit`: Retrieve latest comprehensive security audit report.
- `GET /api/audit/presets/{preset_id}`: Switch benchmarks (`standard`, `vulnerable`, `hardened`).
- `POST /api/audit/scan`: Ingest custom Windows Firewall JSON export.
- `GET /api/rules`: Query and filter individual firewall policies.
- `GET /api/profiles`: Retrieve Domain, Private, and Public configurations.
- `GET /api/remediation/powershell`: Download automated `.ps1` hardening script.
- `GET /api/remediation/netsh`: Download automated `.bat` remediation script.
- `GET /api/remediation/report/markdown`: Download executive Markdown report.

---

## 🔒 Security Best Practices Implemented

1. **Defense-in-Depth**: Evaluates both high-level profile states and granular port rules.
2. **CIS Windows Benchmark Alignment**: Validates `Default Inbound: Block` and strict outbound telemetry.
3. **Container Isolation**: Dockerized backend runs isolated on WSL 2 Ubuntu 22.04 with least-privilege principles.
4. **Zero-Touch Remediation**: Hardening commands generated dynamically, avoiding manual policy errors.
