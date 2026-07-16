# Changesets

Every PR must include one Changeset that marks the release impact as `major`,
`minor`, or `patch`.

Create one with:

```sh
pnpm changeset
```

Use this shape:

```md
---
"field-log.app": patch
---

Add release automation.
```

Guidelines:

- Use `patch` for fixes, docs, tests, internal tooling, and compatible chores.
- Use `minor` for new compatible user-facing behavior or workflows.
- Use `major` for breaking API, database, or mobile compatibility changes.
- Keep the description terse, human friendly, and changelog-ready.
- Write what changed, not why the PR exists.
