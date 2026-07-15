#!/usr/bin/env bash
set -euo pipefail

anchor_deploy_args=()
args=("$@")

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --secrets-file)
      if [[ "$#" -lt 2 ]]; then
        echo "--secrets-file requires a value." >&2
        exit 2
      fi
      anchor_deploy_args+=("--secrets-file" "$2")
      shift 2
      ;;
    --secrets-file=*)
      anchor_deploy_args+=("$1")
      shift
      ;;
    *)
      shift
      ;;
  esac
done

deploy_anchor_version() {
  echo "Deploying preview Worker anchor version so the latest Worker version is deployed."
  pnpm dlx wrangler deploy \
    --config wrangler.jsonc \
    --env preview \
    "${anchor_deploy_args[@]}"
}

set +e
upload_output="$(
  pnpm dlx wrangler versions upload \
    --config wrangler.jsonc \
    --env preview \
    "${args[@]}" 2>&1
)"
upload_status=$?
set -e

printf '%s\n' "$upload_output"

if [[ "$upload_status" -eq 0 ]]; then
  deploy_anchor_version
  exit 0
fi

if [[ "$upload_output" != *"does not yet exist"* ]]; then
  exit "$upload_status"
fi

echo "Preview Worker does not exist yet; creating it with wrangler deploy."
pnpm dlx wrangler deploy \
  --config wrangler.jsonc \
  --env preview \
  "${anchor_deploy_args[@]}"

pnpm dlx wrangler versions upload \
  --config wrangler.jsonc \
  --env preview \
  "${args[@]}"

deploy_anchor_version
