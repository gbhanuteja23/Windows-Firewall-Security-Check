#!/usr/bin/env bash
set -e

PORT=${PORT:-8080}
CONTAINER_NAME="windows-firewall-backend"
IMAGE_NAME="windows-firewall-security-check:latest"

echo "=================================================================="
echo " Starting Windows Firewall Security Check Backend Container"
echo " Host: WSL 2 Ubuntu 22.04 | Port: $PORT"
echo "=================================================================="

# Check if container is already running
if [ "$(docker ps -q -f name=^/${CONTAINER_NAME}$)" ]; then
    echo "[+] Container '$CONTAINER_NAME' is already running."
elif [ "$(docker ps -aq -f name=^/${CONTAINER_NAME}$)" ]; then
    echo "[*] Starting existing stopped container '$CONTAINER_NAME'..."
    docker start "$CONTAINER_NAME"
else
    # Check if image exists
    if [ -z "$(docker images -q $IMAGE_NAME)" ]; then
        echo "[*] Building Docker image '$IMAGE_NAME' from Dockerfile..."
        DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
        docker build -t "$IMAGE_NAME" -f "$DIR/Dockerfile" "$DIR"
    fi
    echo "[*] Creating and starting container '$CONTAINER_NAME' on port $PORT..."
    docker run -d --name "$CONTAINER_NAME" -p "$PORT:8080" --restart unless-stopped "$IMAGE_NAME"
fi

echo "[*] Polling http://localhost:$PORT/api/health..."
for i in {1..20}; do
    if curl -s -f "http://localhost:$PORT/api/health" > /dev/null; then
        echo "[+] Backend is HEALTHY at http://localhost:$PORT!"
        echo "[+] API Documentation: http://localhost:$PORT/docs"
        break
    fi
    sleep 1
done
