# FigJam

Use this command when the user asks Claude to read from FigJam/Figma, generate
updates for the FigJam/Figma files, or use FigJam/Figma context to update repo
apps/components.

## Required Behavior

- Use the shared repo CLI. Do not call the Figma API ad hoc.
- Read secrets only through Infisical path `/figma/figjam`.
- Never print, persist, or commit `FIGMA_ACCESS_TOKEN`.
- Respect `FIGMA_FIGJAM_ALLOWED_FILE_KEYS`.
- Treat FigJam/Figma as planning and design context, not automatic permission to
  change code.
- Generate plugin payloads for canvas updates; do not claim the canvas is
  updated until the private plugin applies the payload.

## Files

- `FIGMA_FIGJAM_FILE_KEY`: primary FigJam planning board.
- Second key in `FIGMA_FIGJAM_ALLOWED_FILE_KEYS`: Figma design file for web and
  mobile UI designs.

Both files can be read. Both files can be updated through generated plugin
payloads when the user explicitly asks.

## Commands

```sh
infisical run --env=dev --path=/figma/figjam -- pnpm figjam read
infisical run --env=dev --path=/figma/figjam -- pnpm figjam read <fileKey>
infisical run --env=dev --path=/figma/figjam -- pnpm figjam write-payload <payload.json>
pnpm figjam serve-outbox
```

Before implementing frontend UI/layout changes from FigJam/Figma, read and
apply `docs/design-system.md`.
