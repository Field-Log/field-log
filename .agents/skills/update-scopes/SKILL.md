---
name: update-scopes
description: Analyze this repository's directories, packages, apps, and tooling to suggest updates to conventional commit scopes in docs/commit-lint.md. Use when the user asks to review, add, remove, rename, or refresh commitlint scopes, or to keep commit scopes aligned with repo structure.
---

# Update Scopes

Keep conventional commit scopes aligned with the repository without duplicating
the source of truth.

## Workflow

1. Read `./docs/commit-lint.md` and extract the current scopes from its
   `## Scopes` table.
2. Inspect repository structure with `rg --files`, package manifests,
   top-level config files, app directories, package directories, docs, and
   skill folders.
3. Compare the discovered ownership boundaries to the documented scopes.
   Identify likely additions, removals, renames, and coverage clarifications.
4. Present the proposed scope changes to the user first. Include the reason for
   each change and the paths it would cover.
5. Wait for explicit user acceptance before editing files.
6. After acceptance, update `./docs/commit-lint.md`. Update workflows only when
   they contain hard-coded type or scope lists, or when their commitlint doc
   reference needs to change.
7. Run focused validation after edits:
   - `pnpm exec commitlint` with one valid sample using an affected scope
   - `pnpm lint` when Markdown, workflow, hook, or config changes should be
     linted

## Rules

- Treat `./docs/commit-lint.md` as the only source of truth for allowed
  conventional commit types and scopes.
- Do not repeat the current scope list inside this skill.
- Prefer stable ownership boundaries over one-off folders.
- Keep scope names short, lowercase, and hyphenated when needed.
- Do not remove an existing scope unless no current path, package, workflow, or
  skill still needs it.
