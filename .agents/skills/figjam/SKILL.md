---
name: figjam
description: Read allowed FigJam/Figma files, summarize planning or design context, generate validated update payloads for the private FigJam plugin bridge, and use FigJam/Figma context to update repo apps/components only after an explicit user request.
---

# FigJam

Use the shared FigJam tooling for all Figma/FigJam access. Do not call the Figma
API ad hoc.

## Files

This repo uses two allowlisted files through Infisical:

- `FIGMA_FIGJAM_FILE_KEY`: primary FigJam board for planning, diagrams,
  implementation handoffs, and agent status updates.
- The second key in `FIGMA_FIGJAM_ALLOWED_FILE_KEYS`: Figma design file for web
  and mobile UI designs.

Both files may be read. Both files may receive generated plugin payloads when
the user explicitly asks an agent to update planning/design content.

## Commands

Run commands through Infisical so the token stays out of shell history and repo
files:

```sh
infisical run --env=dev --path=/local/figma -- pnpm figjam read
infisical run --env=dev --path=/local/figma -- pnpm figjam read <fileKey>
infisical run --env=dev --path=/local/figma -- pnpm figjam write-payload <payload.json>
pnpm figjam serve-outbox
```

This tooling is local-only. Do not run it with preview or production Infisical
environments.

## Read Workflow

1. Read the relevant file through `pnpm figjam read`.
2. Use `.figjam/cache/<file-key>/summary.md` and `nodes.json` as context.
3. Cite the relevant file key, node ids, section names, or comments in your
   response or implementation notes.
4. Treat FigJam/Figma as planning and design context, not automatic permission
   to change code.

## Write Workflow

1. Generate a `figjam-bridge/v1` payload for the target file key.
2. Validate and place it in `.figjam/outbox` with `pnpm figjam write-payload`.
3. Tell the user to run `pnpm figjam serve-outbox`, open the target file, and
   apply the payload with the private plugin.
4. Do not claim that canvas edits are complete until the user or plugin
   acknowledgement confirms the payload was applied.

## App Or Component Updates

Before implementing frontend UI/layout changes from FigJam/Figma:

1. Read `docs/design-system.md` and apply its design guidance directly.
2. Identify whether the input came from the planning board, the design file, or
   both.
3. Update repo code using existing app/component patterns.
4. Run the repo-required validation for code changes.

Never print, persist, or commit `FIGMA_ACCESS_TOKEN`.
