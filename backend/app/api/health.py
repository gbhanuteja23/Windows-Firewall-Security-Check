from datetime import datetime
from fastapi import APIRouter
from app.core.config import APP_NAME, APP_VERSION, CONTAINER_RUNTIME, PORT

router = APIRouter(prefix="/api/health", tags=["Health & System"])


@router.get("")
def health_check():
    """System and container health probe endpoint."""
    return {
        "status": "healthy",
        "app_name": APP_NAME,
        "version": APP_VERSION,
        "runtime_environment": CONTAINER_RUNTIME,
        "port": PORT,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "os": "Ubuntu 22.04 LTS (WSL 2 Host)",
    }
