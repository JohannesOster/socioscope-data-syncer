# The Socioscope: data-syncter

Storage substrate for the Socioscope corpus — browse cases, view transcripts, upload analysis files, and overlay coded annotations, all backed directly by S3.

## Local development

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

`.env.local` (gitignored):

```
AWS_ACCESS_KEY_ID=…
AWS_SECRET_ACCESS_KEY=…
AWS_REGION=eu-west-3
S3_BUCKET=socioscope-data-syncer-dev    # or thesocioscope-corpus
SHARED_PASSWORD=…
```

## Deploy to EC2

One-shot first-time setup is captured in `deploy/setup.sh` (Node 20, nginx, systemd, pnpm). For ongoing deploys:

```bash
./deploy/deploy.sh
# or
./deploy/deploy.sh <ec2-public-dns> [key-file]
```

The script rsyncs source, runs `pnpm install && pnpm build && pnpm prune --prod` on the server, and restarts the systemd unit. Defaults are read from `deploy/aws-resources.txt`. Build happens on the server — Turbopack-built `.next/` artifacts contain machine-specific module hashes and don't transfer cleanly.

Server `.env.local` lives at `/home/ubuntu/data-syncer/.env.local` (mode 600), same shape as local but pointing at the prod bucket:

```
AWS_ACCESS_KEY_ID=…
AWS_SECRET_ACCESS_KEY=…
AWS_REGION=eu-west-3
S3_BUCKET=thesocioscope-corpus
SHARED_PASSWORD=…
```

To switch the running instance between dev and prod buckets without redeploying:

```bash
ssh -i ~/.ssh/data-syncer.pem ubuntu@<host> \
  "sed -i 's/socioscope-data-syncer-dev/thesocioscope-corpus/' ~/data-syncer/.env.local \
   && sudo systemctl restart data-syncer"
```

(Reverse the sed args to roll back.)
