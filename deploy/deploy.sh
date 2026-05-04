#!/bin/bash
# Build locally, rsync to EC2, restart service.
# Usage: ./deploy/deploy.sh <ec2-public-dns> [key-file]
set -euo pipefail

HOST="${1:-}"
KEY="${2:-$HOME/.ssh/data-syncer.pem}"

if [ -z "$HOST" ]; then
  echo "Usage: $0 <ec2-public-dns> [key-file]"
  exit 1
fi

cd "$(dirname "$0")/.."

echo "==> Building locally"
pnpm build

echo "==> Syncing to $HOST"
rsync -az --delete \
  -e "ssh -i $KEY -o StrictHostKeyChecking=accept-new" \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.env*' \
  --exclude='.DS_Store' \
  --exclude='deploy/aws-resources.txt' \
  ./ "ubuntu@$HOST:/home/ubuntu/data-syncer/"

echo "==> Installing prod deps + restarting"
ssh -i "$KEY" "ubuntu@$HOST" '
  set -e
  cd /home/ubuntu/data-syncer
  pnpm install --prod --frozen-lockfile
  sudo systemctl restart data-syncer
  sleep 2
  systemctl --no-pager status data-syncer | head -20
'

echo "==> Done. Visit http://$HOST"
