#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .ship.env ]; then
  echo "❌ .ship.env not found."
  echo "   Run: cp .ship.env.example .ship.env  and fill in your EC2 info."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .ship.env
set +a

IMAGE_NAME="pet-butler-line-bot"
TAG="${TAG:-latest}"
TAR_FILE="/tmp/${IMAGE_NAME}-${TAG}.tar"
REMOTE_TAR="${REMOTE_DIR}/${IMAGE_NAME}-${TAG}.tar"

echo "📦 [1/5] Building image for linux/amd64..."
docker buildx build --platform linux/amd64 -t "${IMAGE_NAME}:${TAG}" --load .

echo "💾 [2/5] Saving image to ${TAR_FILE}..."
docker save -o "${TAR_FILE}" "${IMAGE_NAME}:${TAG}"

echo "📁 [3/5] Ensuring remote dir ${REMOTE_DIR} exists..."
ssh -i "${SSH_KEY}" "${EC2_USER}@${EC2_HOST}" "mkdir -p ${REMOTE_DIR}"

echo "🚀 [4/5] Uploading image + compose file + Caddyfile..."
scp -i "${SSH_KEY}" "${TAR_FILE}" "${EC2_USER}@${EC2_HOST}:${REMOTE_TAR}"
scp -i "${SSH_KEY}" docker-compose.prod.yml "${EC2_USER}@${EC2_HOST}:${REMOTE_DIR}/docker-compose.yml"
scp -i "${SSH_KEY}" Caddyfile "${EC2_USER}@${EC2_HOST}:${REMOTE_DIR}/Caddyfile"

echo "🐳 [5/5] Loading image and restarting service on EC2..."
ssh -i "${SSH_KEY}" "${EC2_USER}@${EC2_HOST}" bash <<EOF
  set -e
  cd ${REMOTE_DIR}
  if [ ! -f .env ]; then
    echo "❌ ${REMOTE_DIR}/.env not found on EC2."
    echo "   Create it manually first (see README/instructions)."
    exit 1
  fi
  docker load -i ${IMAGE_NAME}-${TAG}.tar
  docker compose down || true
  docker compose up -d
  rm -f ${IMAGE_NAME}-${TAG}.tar
  docker image prune -f
EOF

rm -f "${TAR_FILE}"
echo "✅ Deployed to ${EC2_HOST}"
