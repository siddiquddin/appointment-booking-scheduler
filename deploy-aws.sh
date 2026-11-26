#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Chronos Atelier â€” AWS EC2 Deployment Script (Ubuntu 24.04 LTS)
# Automates preflight verification, Docker Compose build, startup, and healthcheck.
# ==============================================================================

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo "============================================================"
echo "  Appointment & Booking Scheduler â€” AWS Production Deploy"
echo "============================================================"

# 1. Verify .env file exists and is configured
if [ ! -f ".env" ]; then
  echo "[ERROR] .env file not found."
  echo "        Run: cp .env.example .env && nano .env"
  echo "        Ensure MONGODB_URI and CORS_ORIGIN are set before deploying."
  exit 1
fi

if grep -q "<user>:<password>" .env; then
  echo "[ERROR] .env still contains placeholder MongoDB credentials."
  echo "        Update MONGODB_URI with your real MongoDB Atlas URI."
  exit 1
fi

# 2. Verify Docker & Compose plugin
if ! command -v docker >/dev/null 2>&1; then
  echo "[INFO] Docker not found. Installing Docker Engine & Compose plugin..."
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo usermod -aG docker "$USER"
  echo "[INFO] Docker installed successfully."
fi

# 3. Tear down previous stale containers cleanly and rebuild
echo "[INFO] Pulling base images and building containers..."
docker compose down --remove-orphans || true
docker compose build --no-cache
docker compose up -d

# 4. Wait for backend health endpoint to report 200 OK
echo "[INFO] Waiting for backend health check (/api/health)..."
RETRIES=20
SLEEP_SEC=3
HEALTH_OK=0

for i in $(seq 1 "$RETRIES"); do
  if curl -fsS "http://localhost/api/health" >/dev/null 2>&1; then
    HEALTH_OK=1
    break
  fi
  echo "  Attempt $i/$RETRIES â€” waiting ${SLEEP_SEC}s..."
  sleep "$SLEEP_SEC"
done

if [ "$HEALTH_OK" -eq 1 ]; then
  echo "[SUCCESS] Deployment live!"
  echo "          Frontend URL : http://$(curl -fsS http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'localhost')"
  echo "          Health Check : http://localhost/api/health"
  docker compose ps
else
  echo "[WARN] Health endpoint did not return 200 within timeout."
  echo "       Inspect logs via: docker compose logs -f backend frontend"
  exit 1
fi
