#!/usr/bin/env bash

ci_log_redact_filter='
  def scrub:
    if type == "object" then
      with_entries(
        if (.key | test("authorization|apiKey|clientSecret|connectionString|cookie|databaseUrl|database_url|jwt|passphrase|password|privateKey|secret|session|token"; "i")) then
          .value = "[REDACTED]"
        else
          .value |= scrub
        end
      )
    elif type == "array" then
      map(scrub)
    else
      .
    end;
  scrub
'

ci_log_github_attributes() {
  jq -cn \
    --arg workflow_name "${GITHUB_WORKFLOW:-}" \
    --arg run_id "${GITHUB_RUN_ID:-}" \
    --arg job_name "${CI_JOB_NAME:-}" \
    --arg pull_request_number "${PR_NUMBER:-}" \
    --arg git_branch "${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:-}}" \
    --arg commit_sha "${GITHUB_SHA:-}" \
    '{
      workflowName: $workflow_name,
      runId: $run_id,
      jobName: $job_name,
      pullRequestNumber: $pull_request_number,
      gitBranch: $git_branch,
      commitSha: $commit_sha
    } | with_entries(select(.value != ""))'
}

ci_log_ingest() {
  local event="$1"

  if [[ -z "${AXIOM_TOKEN:-}" || -z "${AXIOM_DATASET:-}" ]]; then
    return
  fi

  local domain="${AXIOM_EDGE_DOMAIN:-api.axiom.co}"
  local response_file
  response_file="$(mktemp)"
  local status
  local curl_status

  set +e
  status="$(curl --silent --show-error \
    --output "$response_file" \
    --write-out "%{http_code}" \
    --request POST \
    --header "Authorization: Bearer ${AXIOM_TOKEN}" \
    --header "Content-Type: application/json" \
    --data "[$event]" \
    "https://${domain}/v1/datasets/${AXIOM_DATASET}/ingest")"
  curl_status=$?
  set -e

  if [[ "$curl_status" -ne 0 || "${status:-000}" -lt 200 || "${status:-000}" -ge 300 ]]; then
    echo "Axiom CI log ingest failed with HTTP ${status:-000}; continuing." >&2
  fi

  rm -f "$response_file"
}

emit_ci_log() {
  local level="$1"
  local message="$2"
  local attributes="${3:-}"
  local normalized_attributes
  local event

  if [[ -z "$attributes" ]]; then
    attributes="{}"
  fi

  if ! normalized_attributes="$(jq -c . <<< "$attributes" 2> /dev/null)"; then
    normalized_attributes="{}"
  fi

  event="$(jq -cn \
    --arg app "ci" \
    --arg environment "${GITHUB_ACTIONS:+github-actions}" \
    --arg level "$level" \
    --arg message "$message" \
    --arg timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --argjson base_attributes "$(ci_log_github_attributes)" \
    --argjson attributes "$normalized_attributes" \
    "$ci_log_redact_filter | {
      app: \$app,
      environment: (if \$environment == \"\" then \"local\" else \$environment end),
      level: \$level,
      message: \$message,
      timestamp: \$timestamp,
      attributes: (\$base_attributes + \$attributes | scrub)
    }")"

  printf '%s\n' "$event"
  ci_log_ingest "$event"
}
