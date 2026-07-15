#!/usr/bin/env bash
set -euo pipefail

base_args=()
secrets_file=""
secrets_copies=()

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --secrets-file)
      if [[ "$#" -lt 2 ]]; then
        echo "--secrets-file requires a value." >&2
        exit 2
      fi
      secrets_file="$2"
      shift 2
      ;;
    --secrets-file=*)
      secrets_file="${1#--secrets-file=}"
      shift
      ;;
    *)
      base_args+=("$1")
      shift
      ;;
  esac
done

cleanup_secrets_copies() {
  local secrets_copy

  for secrets_copy in "${secrets_copies[@]}"; do
    if [[ -e "$secrets_copy" ]]; then
      rm -f "$secrets_copy"
    fi
  done
}

trap cleanup_secrets_copies EXIT

prepare_secrets_args() {
  secrets_args=()

  if [[ -z "$secrets_file" ]]; then
    return 0
  fi

  local secrets_copy
  secrets_copy="$(mktemp "${TMPDIR:-/tmp}/field-log-api-preview-secrets.XXXXXX.json")"
  cp "$secrets_file" "$secrets_copy"
  secrets_copies+=("$secrets_copy")
  secrets_args=("--secrets-file" "$secrets_copy")
}

deploy_anchor_version() {
  prepare_secrets_args

  echo "Deploying preview Worker anchor version so the latest Worker version is deployed."
  pnpm dlx wrangler deploy \
    --config wrangler.jsonc \
    --env preview \
    "${secrets_args[@]}"
}

prepare_secrets_args

set +e
upload_output="$(
  pnpm dlx wrangler versions upload \
    --config wrangler.jsonc \
    --env preview \
    "${base_args[@]}" \
    "${secrets_args[@]}" 2>&1
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
prepare_secrets_args

pnpm dlx wrangler deploy \
  --config wrangler.jsonc \
  --env preview \
  "${secrets_args[@]}"

prepare_secrets_args

pnpm dlx wrangler versions upload \
  --config wrangler.jsonc \
  --env preview \
  "${base_args[@]}" \
  "${secrets_args[@]}"

deploy_anchor_version
