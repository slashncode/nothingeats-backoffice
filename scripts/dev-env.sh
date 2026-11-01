#!/usr/bin/env bash
# Runs a command with the local cluster's backoffice settings. Secrets come from the gitops repo's
# SOPS files into the environment only; nothing is written to disk.
# Garage's S3 API needs a port-forward: kubectl --context k3d-nothingeats -n nothingeats port-forward svc/garage 13900:3900
#   scripts/dev-env.sh pnpm dev
set -euo pipefail

gitops="$(cd "$(dirname "$0")/../../nothingeats-gitops" && pwd)"
secret() { sops -d --extract "[\"stringData\"][\"$2\"]" "$gitops/infrastructure/configs/$1"; }

DATABASE__PASSWORD="$(secret postgres-role-backoffice.sops.yaml password)" \
S3__ACCESS_KEY="$(secret garage-keys.sops.yaml accessKey)" \
S3__SECRET_KEY="$(secret garage-keys.sops.yaml secretKey)" \
PAYLOAD__SECRET="${PAYLOAD__SECRET:-$(openssl rand -hex 32)}" \
    exec "$@"
