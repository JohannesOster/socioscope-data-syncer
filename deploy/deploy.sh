#!/bin/bash
# Sync source to EC2, build there, restart service.
# Usage: ./deploy/deploy.sh [ec2-public-dns] [key-file]
#
# Defaults are read from deploy/aws-resources.txt if no args are given.
set -euo pipefail

cd "$(dirname "$0")/.."

# Pull defaults from aws-resources.txt if present
if [ -f deploy/aws-resources.txt ]; then
  # shellcheck disable=SC1091
  source deploy/aws-resources.txt
fi

HOST="${1:-${PUBLIC_DNS:-}}"
KEY="${2:-${KEY_PAIR_FILE:-$HOME/.ssh/data-syncer.pem}}"

if [ -z "$HOST" ]; then
  echo "Usage: $0 <ec2-public-dns> [key-file]"
  echo "  or: populate deploy/aws-resources.txt with PUBLIC_DNS=…"
  exit 1
fi

SSH_OPTS=(-i "$KEY" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null)

echo "==> Syncing source to $HOST"
rsync -az --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env*' \
  --exclude='.DS_Store' \
  --exclude='deploy/aws-resources.txt' \
  ./ "ubuntu@$HOST:/home/ubuntu/data-syncer/"

echo "==> Building on server + restarting"
ssh "${SSH_OPTS[@]}" "ubuntu@$HOST" '
  set -e
  cd /home/ubuntu/data-syncer
  pnpm install --frozen-lockfile
  NODE_OPTIONS="--max-old-space-size=2048" pnpm build
  pnpm prune --prod
  sudo systemctl restart data-syncer
  sleep 2
  systemctl --no-pager status data-syncer | head -10
'

echo "==> Done. http://$HOST"
