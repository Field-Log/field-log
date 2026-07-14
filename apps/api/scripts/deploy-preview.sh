#!/usr/bin/env bash
set -euo pipefail

set +e
upload_output="$(
  pnpm dlx wrangler versions upload \
    --config wrangler.jsonc \
    --env preview \
    "$@" 2>&1
)"
upload_status=$?
set -e

printf '%s\n' "$upload_output"

if [[ "$upload_status" -eq 0 ]]; then
  exit 0
fi

if [[ "$upload_output" != *"does not yet exist"* ]]; then
  exit "$upload_status"
fi

echo "Preview Worker does not exist yet; creating it with wrangler deploy."
pnpm dlx wrangler deploy \
  --config wrangler.jsonc \
  --env preview

pnpm dlx wrangler versions upload \
  --config wrangler.jsonc \
  --env preview \
  "$@"
