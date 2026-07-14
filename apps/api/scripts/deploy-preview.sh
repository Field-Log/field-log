#!/usr/bin/env bash
set -euo pipefail

pnpm dlx wrangler deploy \
  --config wrangler.jsonc \
  --env preview \
  "$@"
