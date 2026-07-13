#!/usr/bin/env bash

set -euo pipefail

NEON_API_BASE="${NEON_API_BASE:-https://console.neon.tech/api/v2}"
MAX_NEON_BRANCHES="${MAX_NEON_BRANCHES:-10}"
PRODUCTION_BRANCH_NAME="${PRODUCTION_BRANCH_NAME:-production}"
STAGING_BRANCH_NAME="${STAGING_BRANCH_NAME:-staging}"

require_env() {
  local name="$1"

  if [[ -z "${!name:-}" ]]; then
    echo "$name is required." >&2
    exit 1
  fi
}

require_neon_env() {
  require_env NEON_API_KEY
  require_env NEON_PROJECT_ID
  require_env NEON_DATABASE_NAME
  require_env NEON_DATABASE_USER
}

api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"

  if [[ -n "$body" ]]; then
    curl --fail --silent --show-error \
      --request "$method" \
      --header "Authorization: Bearer ${NEON_API_KEY}" \
      --header "content-type: application/json" \
      --data "$body" \
      "${NEON_API_BASE}${path}"
  else
    curl --fail --silent --show-error \
      --request "$method" \
      --header "Authorization: Bearer ${NEON_API_KEY}" \
      "${NEON_API_BASE}${path}"
  fi
}

url_encode() {
  jq -rn --arg value "$1" '$value | @uri'
}

emit_ci_log() {
  local level="$1"
  local message="$2"
  local attributes="${3:-}"
  local normalized_attributes

  if [[ -z "$attributes" ]]; then
    attributes="{}"
  fi

  if ! normalized_attributes="$(jq -c . <<< "$attributes" 2> /dev/null)"; then
    normalized_attributes="{}"
  fi

  jq -cn \
    --arg app "ci" \
    --arg environment "${GITHUB_ACTIONS:+github-actions}" \
    --arg level "$level" \
    --arg message "$message" \
    --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --argjson attributes "$normalized_attributes" \
    '{
      app: $app,
      environment: (if $environment == "" then "local" else $environment end),
      level: $level,
      message: $message,
      timestamp: $timestamp,
      attributes: $attributes
    }'
}

write_output() {
  local key="$1"
  local value="$2"

  if [[ -z "${GITHUB_OUTPUT:-}" ]]; then
    printf '%s=%s\n' "$key" "$value"
    return
  fi

  printf '%s=%s\n' "$key" "$value" >> "$GITHUB_OUTPUT"
}

write_multiline_output() {
  local key="$1"
  local value="$2"

  if [[ -z "${GITHUB_OUTPUT:-}" ]]; then
    printf '%s<<EOF\n%s\nEOF\n' "$key" "$value"
    return
  fi

  {
    printf '%s<<EOF\n' "$key"
    printf '%s\n' "$value"
    printf 'EOF\n'
  } >> "$GITHUB_OUTPUT"
}

list_branches() {
  api GET "/projects/${NEON_PROJECT_ID}/branches?limit=10000&sort_by=name&sort_order=asc"
}

branch_id_from_list() {
  local branches_json="$1"
  local branch_name="$2"

  jq -r --arg name "$branch_name" \
    '.branches[] | select(.name == $name) | .id' <<< "$branches_json" | head -n 1
}

branch_count_from_list() {
  local branches_json="$1"

  jq -r '.branches | length' <<< "$branches_json"
}

branch_names_from_list() {
  local branches_json="$1"

  jq -r '.branches[].name' <<< "$branches_json"
}

connection_uri() {
  local branch_id="$1"
  local database_name
  database_name="$(url_encode "$NEON_DATABASE_NAME")"
  local role_name
  role_name="$(url_encode "$NEON_DATABASE_USER")"

  api GET "/projects/${NEON_PROJECT_ID}/connection_uri?branch_id=${branch_id}&database_name=${database_name}&role_name=${role_name}&pooled=true" |
    jq -r '.uri'
}

mask_and_output_database_url() {
  local value="$1"

  printf '::add-mask::%s\n' "$value"
  write_output database_url "$value"
}

wait_for_branch_ready() {
  local branch_name="$1"
  local attempts="${2:-60}"

  for _ in $(seq 1 "$attempts"); do
    local branches_json
    branches_json="$(list_branches)"

    local state
    state="$(jq -r --arg name "$branch_name" \
      '.branches[] | select(.name == $name) | .current_state // empty' \
      <<< "$branches_json" | head -n 1)"

    if [[ "$state" == "ready" ]]; then
      branch_id_from_list "$branches_json" "$branch_name"
      return
    fi

    sleep 5
  done

  echo "Timed out waiting for Neon branch ${branch_name} to become ready." >&2
  exit 1
}

wait_for_branch_absent() {
  local branch_name="$1"
  local attempts="${2:-60}"

  for _ in $(seq 1 "$attempts"); do
    local branches_json
    branches_json="$(list_branches)"

    local branch_id
    branch_id="$(branch_id_from_list "$branches_json" "$branch_name")"

    if [[ -z "$branch_id" ]]; then
      return
    fi

    sleep 5
  done

  echo "Timed out waiting for Neon branch ${branch_name} to be deleted." >&2
  exit 1
}

delete_branch_if_exists() {
  local branch_name="$1"
  local branches_json="$2"

  local branch_id
  branch_id="$(branch_id_from_list "$branches_json" "$branch_name")"

  if [[ -z "$branch_id" ]]; then
    write_output cleanup_performed false
    emit_ci_log info "ci.database.preview.branchCleanup.skipped" "$(jq -n \
      --arg branch_name "$branch_name" \
      '{branchName: $branch_name, reason: "not_found"}')"
    return
  fi

  api DELETE "/projects/${NEON_PROJECT_ID}/branches/${branch_id}" > /dev/null
  wait_for_branch_absent "$branch_name"
  write_output cleanup_performed true
  emit_ci_log info "ci.database.preview.branch.deleted" "$(jq -n \
    --arg branch_name "$branch_name" \
    --arg branch_id "$branch_id" \
    '{branchName: $branch_name, branchId: $branch_id}')"
}

create_branch_from_parent() {
  local branch_name="$1"
  local parent_branch_id="$2"

  local body
  body="$(jq -n \
    --arg name "$branch_name" \
    --arg parent_id "$parent_branch_id" \
    '{endpoints: [{type: "read_write"}], branch: {name: $name, parent_id: $parent_id}}')"

  api POST "/projects/${NEON_PROJECT_ID}/branches" "$body" > /dev/null
  wait_for_branch_ready "$branch_name"
}

write_branch_metadata() {
  local branch_name="$1"
  local branch_id="$2"
  local parent_branch="${3:-}"

  write_output branch_name "$branch_name"
  write_output branch_id "$branch_id"
  write_output branch_url "https://console.neon.tech/app/projects/${NEON_PROJECT_ID}/branches/${branch_id}"

  if [[ -n "$parent_branch" ]]; then
    write_output parent_branch "$parent_branch"
  fi
}

prepare_preview() {
  require_neon_env
  require_env PR_NUMBER
  require_env DB_CHANGING

  if ! [[ "$MAX_NEON_BRANCHES" =~ ^[0-9]+$ ]]; then
    echo "MAX_NEON_BRANCHES must be a non-negative integer." >&2
    exit 1
  fi

  local target_branch="preview-pr-${PR_NUMBER}"
  local branches_json
  branches_json="$(list_branches)"

  local branch_count
  branch_count="$(branch_count_from_list "$branches_json")"
  if ! [[ "$branch_count" =~ ^[0-9]+$ ]]; then
    echo "Neon branch count must be a non-negative integer." >&2
    exit 1
  fi
  local branch_names
  branch_names="$(branch_names_from_list "$branches_json")"
  local production_branch_id
  production_branch_id="$(branch_id_from_list "$branches_json" "$PRODUCTION_BRANCH_NAME")"
  local staging_branch_id
  staging_branch_id="$(branch_id_from_list "$branches_json" "$STAGING_BRANCH_NAME")"
  local target_branch_id
  target_branch_id="$(branch_id_from_list "$branches_json" "$target_branch")"

  if [[ -z "$production_branch_id" ]]; then
    echo "Neon branch ${PRODUCTION_BRANCH_NAME} was not found." >&2
    exit 1
  fi

  if [[ -z "$staging_branch_id" ]]; then
    echo "Neon branch ${STAGING_BRANCH_NAME} was not found." >&2
    exit 1
  fi

  write_output branch_count "$branch_count"
  write_multiline_output branch_names "$branch_names"
  write_output target_branch "$target_branch"
  write_output production_branch_id "$production_branch_id"
  write_output staging_branch_id "$staging_branch_id"

  if [[ "$DB_CHANGING" != "true" ]]; then
    emit_ci_log info "ci.database.preview.noPrBranch.needed" "$(jq -n \
      --arg pr_number "$PR_NUMBER" \
      --arg target_branch "$target_branch" \
      '{pullRequestNumber: $pr_number, targetBranch: $target_branch}')"
    delete_branch_if_exists "$target_branch" "$branches_json"
    local staging_uri
    staging_uri="$(connection_uri "$staging_branch_id")"
    write_output can_deploy true
    write_output isolated false
    write_branch_metadata "$STAGING_BRANCH_NAME" "$staging_branch_id" "$PRODUCTION_BRANCH_NAME"
    emit_ci_log info "ci.database.preview.stagingDatabase.selected" "$(jq -n \
      --arg branch_name "$STAGING_BRANCH_NAME" \
      --arg branch_id "$staging_branch_id" \
      --arg parent_branch "$PRODUCTION_BRANCH_NAME" \
      '{branchName: $branch_name, branchId: $branch_id, parentBranch: $parent_branch}')"
    mask_and_output_database_url "$staging_uri"
    return
  fi

  write_output isolated true

  if [[ -z "$target_branch_id" && "$branch_count" -ge "$MAX_NEON_BRANCHES" ]]; then
    write_output can_deploy false
    write_output blocked_reason branch_limit
    emit_ci_log warn "ci.database.preview.branchLimit.reached" "$(jq -n \
      --arg pr_number "$PR_NUMBER" \
      --arg target_branch "$target_branch" \
      --arg branch_count "$branch_count" \
      --arg max_branches "$MAX_NEON_BRANCHES" \
      --arg branch_names "$branch_names" \
      '{
        pullRequestNumber: $pr_number,
        targetBranch: $target_branch,
        branchCount: ($branch_count | tonumber),
        maxBranches: ($max_branches | tonumber),
        branchNames: ($branch_names | split("\n") | map(select(. != "")))
      }')"
    return
  fi

  if [[ -n "$target_branch_id" ]]; then
    emit_ci_log info "ci.database.preview.prBranchRecreate.requested" "$(jq -n \
      --arg branch_name "$target_branch" \
      --arg branch_id "$target_branch_id" \
      --arg parent_branch "$PRODUCTION_BRANCH_NAME" \
      '{branchName: $branch_name, branchId: $branch_id, parentBranch: $parent_branch}')"
    delete_branch_if_exists "$target_branch" "$branches_json"
  else
    write_output cleanup_performed false
  fi

  local cleanup_target_on_error=true
  cleanup_target_branch_on_error() {
    local exit_code=$?

    if [[ "$cleanup_target_on_error" == "true" ]]; then
      set +e
      local cleanup_branches_json
      cleanup_branches_json="$(list_branches)"
      if [[ -n "$cleanup_branches_json" ]]; then
        delete_branch_if_exists "$target_branch" "$cleanup_branches_json"
      fi
      set -e
    fi

    exit "$exit_code"
  }
  trap cleanup_target_branch_on_error ERR

  local created_branch_id
  created_branch_id="$(create_branch_from_parent "$target_branch" "$production_branch_id")"
  local preview_uri
  preview_uri="$(connection_uri "$created_branch_id")"
  cleanup_target_on_error=false
  trap - ERR

  write_output can_deploy true
  write_branch_metadata "$target_branch" "$created_branch_id" "$PRODUCTION_BRANCH_NAME"
  emit_ci_log info "ci.database.preview.branch.created" "$(jq -n \
    --arg branch_name "$target_branch" \
    --arg branch_id "$created_branch_id" \
    --arg parent_branch "$PRODUCTION_BRANCH_NAME" \
    '{branchName: $branch_name, branchId: $branch_id, parentBranch: $parent_branch}')"
  mask_and_output_database_url "$preview_uri"
}

cleanup_preview() {
  require_neon_env
  require_env PR_NUMBER

  local target_branch="preview-pr-${PR_NUMBER}"
  local branches_json
  branches_json="$(list_branches)"

  delete_branch_if_exists "$target_branch" "$branches_json"
  write_output target_branch "$target_branch"
}

branch_url() {
  require_neon_env
  require_env BRANCH_NAME

  local branches_json
  branches_json="$(list_branches)"

  local branch_id
  branch_id="$(branch_id_from_list "$branches_json" "$BRANCH_NAME")"

  if [[ -z "$branch_id" ]]; then
    echo "Neon branch ${BRANCH_NAME} was not found." >&2
    exit 1
  fi

  local uri
  uri="$(connection_uri "$branch_id")"

  write_branch_metadata "$BRANCH_NAME" "$branch_id"
  local event_message="ci.database.production.database.selected"
  if [[ "$BRANCH_NAME" == "$STAGING_BRANCH_NAME" ]]; then
    event_message="ci.database.staging.database.selected"
  fi

  emit_ci_log info "$event_message" "$(jq -n \
    --arg branch_name "$BRANCH_NAME" \
    --arg branch_id "$branch_id" \
    '{branchName: $branch_name, branchId: $branch_id}')"
  mask_and_output_database_url "$uri"
}

refresh_staging() {
  require_neon_env

  local branches_json
  branches_json="$(list_branches)"

  local production_branch_id
  production_branch_id="$(branch_id_from_list "$branches_json" "$PRODUCTION_BRANCH_NAME")"
  local staging_branch_id
  staging_branch_id="$(branch_id_from_list "$branches_json" "$STAGING_BRANCH_NAME")"

  if [[ -z "$production_branch_id" ]]; then
    echo "Neon branch ${PRODUCTION_BRANCH_NAME} was not found." >&2
    exit 1
  fi

  if [[ -z "$staging_branch_id" ]]; then
    echo "Neon branch ${STAGING_BRANCH_NAME} was not found." >&2
    exit 1
  fi

  local body
  body="$(jq -n --arg source_branch_id "$production_branch_id" '{source_branch_id: $source_branch_id}')"

  emit_ci_log info "ci.database.staging.reset" "$(jq -n \
    --arg branch_name "$STAGING_BRANCH_NAME" \
    --arg branch_id "$staging_branch_id" \
    --arg source_branch "$PRODUCTION_BRANCH_NAME" \
    --arg source_branch_id "$production_branch_id" \
    '{
      branchName: $branch_name,
      branchId: $branch_id,
      sourceBranch: $source_branch,
      sourceBranchId: $source_branch_id
    }')"
  api POST "/projects/${NEON_PROJECT_ID}/branches/${staging_branch_id}/restore" "$body" > /dev/null
  wait_for_branch_ready "$STAGING_BRANCH_NAME"

  local uri
  uri="$(connection_uri "$staging_branch_id")"

  write_branch_metadata "$STAGING_BRANCH_NAME" "$staging_branch_id" "$PRODUCTION_BRANCH_NAME"
  emit_ci_log info "ci.database.staging.database.selected" "$(jq -n \
    --arg branch_name "$STAGING_BRANCH_NAME" \
    --arg branch_id "$staging_branch_id" \
    --arg parent_branch "$PRODUCTION_BRANCH_NAME" \
    '{branchName: $branch_name, branchId: $branch_id, parentBranch: $parent_branch}')"
  mask_and_output_database_url "$uri"
}

case "${1:-}" in
  prepare-preview)
    prepare_preview
    ;;
  cleanup-preview)
    cleanup_preview
    ;;
  branch-url)
    branch_url
    ;;
  refresh-staging)
    refresh_staging
    ;;
  *)
    echo "Usage: $0 {prepare-preview|cleanup-preview|branch-url|refresh-staging}" >&2
    exit 1
    ;;
esac
