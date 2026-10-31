# ==============================================================================
# Dockerfile for Windows Firewall Security Check
# Backend Runtime: WSL 2 Ubuntu 22.04 LTS
# Fixed Port: 8080
# ==============================================================================

FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    HOST=0.0.0.0

# Install Python 3, Pip, and Curl on Ubuntu 22.04 LTS
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python backend dependencies
COPY backend/requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy backend application source (includes pre-built frontend distribution in app/dist)
COPY backend/app ./app

# Expose fixed port 8080
EXPOSE 8080

# Container healthcheck
HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Launch FastAPI ASGI server
CMD ["python3", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
