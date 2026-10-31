import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import APP_NAME, APP_VERSION, PORT, HOST
from app.api.health import router as health_router
from app.api.audit import router as audit_router
from app.api.rules import router as rules_router
from app.api.profiles import router as profiles_router
from app.api.remediation import router as remediation_router

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Cybersecurity assessment and automated auditing API for Windows Defender Firewall.",
)

# Enable CORS for local development & cross-port access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health_router)
app.include_router(audit_router)
app.include_router(rules_router)
app.include_router(profiles_router)
app.include_router(remediation_router)

# Serve Frontend SPA if built distribution exists
dist_dir_candidates = [
    Path(__file__).parent / "dist",
    Path("/app/frontend_dist"),
    Path(__file__).parent.parent.parent / "frontend" / "dist",
]

frontend_dist = None
for candidate in dist_dir_candidates:
    if candidate.exists() and (candidate / "index.html").exists():
        frontend_dist = candidate
        break

if frontend_dist:
    # Mount assets folder if exists
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api/"):
            return None
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def index():
        return {
            "message": "Windows Firewall Security Check API is active.",
            "health_endpoint": "/api/health",
            "audit_endpoint": "/api/audit",
            "documentation": "/docs",
            "runtime": "WSL 2 Ubuntu 22.04 Docker Container",
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=False)
