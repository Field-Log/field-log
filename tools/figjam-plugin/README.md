# Field Log FigJam Bridge Plugin

Private Figma/FigJam plugin for applying agent-generated payloads from
`.figjam/outbox`.

## Local Use

1. Start the bridge from the repo:

   ```sh
   pnpm figjam serve-outbox
   ```

2. In Figma, import this folder as a development plugin.
3. Open the target FigJam board or Figma design file.
4. Run `Field Log FigJam Bridge`.
5. Refresh payloads and apply the intended payload.

The plugin refuses payloads when Figma exposes a file key and that key does not
match the payload file key. Payload validation also happens in the shared CLI
before payloads are written to `.figjam/outbox`.
