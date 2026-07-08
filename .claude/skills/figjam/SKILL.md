---
name: figjam
description: Read allowed FigJam/Figma files, generate plugin payloads for planning/design updates, and use FigJam/Figma context for repo implementation only after explicit user direction.
---

# FigJam

Use `.claude/commands/figjam.md` for the operational workflow.

Important constraints:

- Use `pnpm figjam` through Infisical for reads and payload writes.
- Use the private plugin bridge for canvas updates.
- Keep `FIGMA_ACCESS_TOKEN` out of output and committed files.
- The primary FigJam board and the separate UI design file are both allowed
  read/write-payload targets.
- Apply `docs/design-system.md` before frontend UI/layout implementation.
