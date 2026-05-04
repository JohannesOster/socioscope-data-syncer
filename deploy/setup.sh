#!/bin/bash
# One-time setup on a fresh Ubuntu 24.04 (ARM) EC2 instance.
# Run as root via cloud-init or `sudo bash setup.sh`.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y curl ca-certificates gnupg rsync nginx

# Node 20 (NodeSource), then pnpm
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pnpm

# App user / dir
install -d -o ubuntu -g ubuntu /home/ubuntu/data-syncer

# nginx site
install -m 0644 /tmp/nginx-data-syncer.conf /etc/nginx/sites-available/data-syncer
ln -sf /etc/nginx/sites-available/data-syncer /etc/nginx/sites-enabled/data-syncer
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

# systemd unit
install -m 0644 /tmp/data-syncer.service /etc/systemd/system/data-syncer.service
systemctl daemon-reload
systemctl enable data-syncer

echo "Setup complete. App not yet started (no code/env yet)."
