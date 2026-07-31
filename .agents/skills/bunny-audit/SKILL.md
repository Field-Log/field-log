---
name: bunny-audit
description: Use when auditing a Bunny account for enabled or billable services, including CDN, Stream, Storage, Optimizer, DNS, Edge Scripting, Database, Magic Containers, Shield, billing payment requests, and account usage.
---

# Bunny Audit

Use the repo script instead of manually guessing service endpoints.

## Command

Run from the monorepo root:

```bash
pnpm bunny:audit
```

The command injects `BUNNY_API_KEY` from Infisical `dev` at `/local/bunny`.

## Output

The script writes raw JSON and a Markdown report under:

```text
bunny-audit/
```

Read `bunny-audit/report.md` and summarize:

- services with resources in use
- any nonzero usage or monthly cost fields
- disabled or empty services
- failed endpoint checks

Do not print secrets from raw JSON. Storage zone passwords and API keys can appear
in Bunny responses.
