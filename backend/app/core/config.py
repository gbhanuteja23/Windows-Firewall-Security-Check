import os

PORT = int(os.getenv("PORT", 8080))
HOST = os.getenv("HOST", "0.0.0.0")
APP_NAME = "Windows Firewall Security Check API"
APP_VERSION = "1.0.0"
CONTAINER_RUNTIME = "WSL 2 Ubuntu 22.04 Docker"
