---

name: commit
description: Write git commits using conventional commit format for this monorepo. Use when the user asks to commit, create a commit, or save changes.
---

# Git Commit

Write conventional commits for this monorepo. Never include AI co-authorship lines.

## Format

```
<type>(<scope>): <short summary>

- point form detail
- point form detail
```

## Types

* `feat` — new feature
* `fix` — bug fix
* `refactor` — code change that neither fixes nor adds
* `chore` — tooling, deps, config
* `docs` — documentation only
* `test` — adding or updating tests
* `style` — formatting, lint fixes (no logic change)
* `perf` — performance improvement
* `ci` — CI/CD changes

## Scopes

| Scope | Covers |
|---|---|
| `web` | `apps/web/` |
| `api` | `apps/api/` |
| `mcp-server` | `apps/mcp-server/` |
| `packages` | multiple packages or `packages/` root |
| `database` | `packages/database/` |
| `types` | `packages/types/` |
| `config` | root config files (biome, turbo, pnpm-workspace, tsconfig) |
| `docs` | CLAUDE.md, AGENTS.md, `resources/guides/` |
| `skills` | `.claude/skills/`, `.agents/skills/`, `.claude/commands/` |
| `scripts` | `scripts/` directory |

Use the most specific scope. If changes span multiple scopes, use the primary one or omit scope for truly cross-cutting changes.

## Rules

* Never create a commit on `main`. If the current branch is `main` then prompt the user with a suggestion for a new branch and on approval create and checkout the new branch.
* **No `Co-Authored-By` lines** — commits are from the user only
* **Summary line**: imperative mood, lowercase, no period, max 72 chars
* **Body**: point-form list of changes, keep each point succinct
* **One commit per logical change** — don't bundle unrelated work
* Stage specific files by name — avoid `git add -A` or `git add .`

## Examples

```
feat(web): add markdown preview to draft panel

- add MarkdownRenderer component
- wire up live preview toggle in editor toolbar
- update draft-panel layout for side-by-side view
```

```
fix(api): handle missing slug in article lookup

- return 404 instead of 500 when slug param is undefined
- add validation to getArticleBySlug handler
```

```
chore(config): update biome and turbo settings

- enable new lint rules in biome.json
- add mcp-server to turbo pipeline
```
