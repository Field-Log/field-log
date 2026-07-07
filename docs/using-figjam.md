# Using FigJam

This repo uses FigJam as a planning/design handoff surface for AI agents. Agents
write validated payloads into `.figjam/outbox`, and the local private plugin
applies those payloads to the open FigJam or Figma file.

The integration has two parts:

- A local bridge server, started with `pnpm figjam serve-outbox`.
- A Figma/FigJam development plugin from `tools/figjam-plugin`.

## Requirements

- Figma desktop app.
- A Figma account with access to the target FigJam/Figma file.
- Repo dependencies installed with `pnpm install`.
- A generated payload in `.figjam/outbox`.

Use the desktop app for this workflow. The local development plugin and
localhost bridge are the supported path for applying AI-agent payloads. The
browser UI can open FigJam files, but it is not the expected environment for
this repo's private plugin/agent integration.

Install the desktop app from the official Figma downloads page:

<https://www.figma.com/downloads/>

After installing, sign in with the same account that has access to the target
board.

## How The Bridge Works

The plugin does not call the Figma API and does not need `FIGMA_ACCESS_TOKEN`.
It only reads local JSON payloads through the local outbox server:

```text
http://localhost:4873
```

The plugin manifest allows only that development origin:

```json
{
  "networkAccess": {
    "allowedDomains": ["none"],
    "devAllowedDomains": ["http://localhost:4873"]
  }
}
```

Do not change the plugin origin to `127.0.0.1` unless the manifest and outbox
server are changed together. Figma validates development plugin network access
strictly.

## Start The Outbox Server

From the repo root, run:

```sh
pnpm figjam serve-outbox
```

Expected output:

```text
FigJam outbox bridge listening on http://localhost:4873
```

Leave this process running while you use the plugin.

To confirm the bridge can see pending payloads:

```sh
curl http://localhost:4873/payloads
```

The response should include payload IDs from `.figjam/outbox`, for example:

```json
{
  "payloads": [
    {
      "payloadId": "current-ui-wireframes-2026-07-06T214047Z",
      "operationCount": 76
    }
  ]
}
```

If the command says the port is already in use, another bridge or Node process
is already bound to port `4873`. Find it with:

```sh
lsof -nP -iTCP:4873 -sTCP:LISTEN
```

Stop that process if it is stale, then rerun `pnpm figjam serve-outbox`.

## Load The Plugin

Open the Figma desktop app, then open the target FigJam board or Figma design
file before running the plugin.

Import the local plugin:

1. Open `Plugins -> Manage plugins...`.
2. Find the development/plugin-building area. Depending on the current Figma UI,
   this may be labeled `Development`, `In development`, or `Build`.
3. Choose `Import plugin from manifest...`.
4. Select:

   ```text
   tools/figjam-plugin/manifest.json
   ```

After import, the plugin name should be:

```text
Field Log FigJam Bridge
```

Run the plugin from the same development plugin area, or open quick actions and
search for `Field Log FigJam Bridge`.

## Load And Apply A Payload

With `pnpm figjam serve-outbox` running and the plugin open:

1. Confirm `Bridge Origin` is:

   ```text
   http://localhost:4873
   ```

2. Click `Refresh`.
3. In the pending payload list, click the payload ID to apply it.

For example, to apply the current UI wireframes payload, click:

```text
current-ui-wireframes-2026-07-06T214047Z
```

The plugin fetches the payload from:

```text
http://localhost:4873/payloads/<payload-file-name>
```

Then it creates the section, shapes, stickies, connectors, and stamps on the
current page. On success, the plugin shows a message like:

```text
Applied 76 operations from current-ui-wireframes-2026-07-06T214047Z.
```

The bridge also appends an acknowledgement to:

```text
.figjam/outbox/acknowledgements.jsonl
```

Canvas edits are only complete after the plugin reports success in Figma.

## Manual Payload Fallback

If the plugin cannot reach `http://localhost:4873` but Figma has imported and
opened the plugin UI:

1. Open the payload JSON file from `.figjam/outbox`.
2. Paste the full JSON into the plugin's `Paste Payload` field.
3. Click `Apply Pasted Payload`.

This still validates the payload shape in the plugin and applies it to the open
file.

## Troubleshooting

### Manifest Error For `allowedDomains`

If Figma reports an error like:

```text
Manifest error: Invalid value for allowedDomains. "http://127.0.0.1:4873" must be a valid URL.
```

Make sure `tools/figjam-plugin/manifest.json` uses `devAllowedDomains`:

```json
"networkAccess": {
  "allowedDomains": ["none"],
  "devAllowedDomains": ["http://localhost:4873"]
}
```

Then import `tools/figjam-plugin/manifest.json` again.

### No Development Plugin Import Option

Use the Figma desktop app, not the browser. If `Plugins -> Manage plugins...`
does not show any development/import option:

- Confirm you are signed in.
- Confirm a FigJam/Figma file is open.
- Restart the desktop app after installing or updating it.
- Check whether the Figma workspace/account blocks development plugins.

### Plugin Shows No Pending Payloads

Confirm the outbox contains a payload:

```sh
find .figjam/outbox -maxdepth 1 -name "*.json" -print
```

Confirm the bridge lists payloads:

```sh
curl http://localhost:4873/payloads
```

If the curl command fails, restart `pnpm figjam serve-outbox`.

### Payload File Key Mismatch

The plugin refuses to apply a payload when Figma exposes a current file key and
that key does not match the payload's `fileKey`.

Open the intended FigJam/Figma file, then run the plugin again. Do not edit the
payload file key by hand; payloads should be generated and validated by the
shared FigJam tooling.

### Payload Applies To The Wrong Page

The plugin creates objects on `figma.currentPage`. Before applying a payload,
switch to the page where the generated section should be created.

## Agent Commands

Read or refresh a FigJam/Figma snapshot through Infisical:

```sh
infisical run --env=dev --path=/figma/figjam -- pnpm figjam read
```

Write and validate an agent-generated payload into `.figjam/outbox`:

```sh
infisical run --env=dev --path=/figma/figjam -- pnpm figjam write-payload <payload.json>
```

Serve the outbox for the desktop plugin:

```sh
pnpm figjam serve-outbox
```

Never print, persist, or commit `FIGMA_ACCESS_TOKEN`.
