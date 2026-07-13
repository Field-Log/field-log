# Commit Lint

Conventional commit types and scopes for this repository are maintained here.
Commitlint, Git hooks, CI, and agent skills should read this document instead of
duplicating the lists.

## Format

```text
<type>(<scope>): <short summary>
```

The scope may be omitted for truly cross-cutting changes.

## Types

| Type | Covers |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes nor adds a feature |
| `chore` | Tooling, dependencies, and configuration |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `style` | Formatting and lint fixes with no logic change |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |

## Scopes

| Scope | Covers |
|---|---|
| `web` | `apps/web/` |
| `api` | `apps/api/` |
| `mobile` | `apps/mobile/` |
| `field-log` | `apps/field-log/` |
| `autmog` | `apps/autmog/` |
| `packages` | Multiple packages or the `packages/` root |
| `database` | `packages/database/` |
| `eslint` | `packages/eslint/` |
| `figjam` | `packages/figjam/` |
| `github-discord-notifier` | `packages/github-discord-notifier/` |
| `infisical-runner` | `packages/infisical-runner/` |
| `json-data` | `packages/json-data/` |
| `logger` | `packages/logger/` |
| `services` | `packages/services/` |
| `tsconfig` | `packages/tsconfig/` |
| `types` | `packages/types/` |
| `config` | Root config files such as Biome, Turbo, pnpm workspace, and TypeScript config |
| `docs` | `README.md`, `CLAUDE.md`, `AGENTS.md`, and `docs/` |
| `ci` | `.github/workflows/` and `.githooks/` |
| `skills` | `.claude/skills/`, `.agents/skills/`, and `.claude/commands/` |
| `scripts` | `scripts/` directory |

## Rules

- Use the most specific scope when one applies.
- Use no scope only when a change is truly cross-cutting.
- Keep the summary imperative, lowercase, and without a period.
- Keep the header at or under 72 characters.
- Do not include AI co-authorship or generated-by lines.
