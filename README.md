# machinedpens.info

Monorepo for the machinedpens.info apps and shared packages.

## Getting started

### Prerequisites

- Node.js 22
- Corepack, enabled with `corepack enable`
- pnpm 10.33.2, provided by the repo `packageManager` setting
- Infisical CLI access to the `Field Log` project

Install dependencies after cloning:

```sh
corepack enable
pnpm install
```

### Installing and configuring Infisical

This repo uses the Infisical project `Field Log` for local Development secrets.
Production and preview host secrets are synced from Infisical into the hosting
platform where possible.

See [Environment Variables](docs/environment-variables.md) for app-specific
runtime variables and [Cloudflare API Deployment](docs/cloudflare-api.md) for
Worker deployment setup.

1. Install the official Infisical CLI for your OS:
   <https://infisical.com/docs/cli/overview>

2. Confirm the CLI is available:

   ```sh
   infisical --version
   ```

3. Authenticate with Infisical:

   ```sh
   infisical login
   ```

4. Initialize or verify the repo project config:

   ```sh
   infisical init
   ```

   Choose the `Field Log` project if prompted.

5. Test local Infisical access:

   ```sh
   infisical run --env=dev --path=/local/smoke -- node -e "console.log(process.env.TEST)"
   ```

   You should see:

   ```txt
   Infisical working
   ```

6. Confirm the app secret folders you need exist in Infisical:

   - `/apps/api` in `dev`, `preview`, and `prod`
   - `/apps/web` in `dev`, `preview`, and `prod`
   - `/apps/mobile` in `dev`
   - `/tools/cloudflare` in `dev`, `preview`, and `prod`, if deploying the API
   - `/tools/logger-axiom-test` in `dev`, if running the live Axiom logger test

### Cloudflare API setup

`apps/api` runs as a Cloudflare Worker. Local API development uses
`wrangler dev` through Infisical so the local runtime matches the deployed
Worker runtime.

Before deploying the API, configure:

- the `field-log.app` zone in Cloudflare
- Worker custom domains for `api.field-log.app` and
  `api.staging.field-log.app`
- Infisical Cloudflare App Connection and Cloudflare Workers Secret Syncs
- `/tools/cloudflare` deploy credentials in Infisical

The full setup is documented in [docs/cloudflare-api.md](docs/cloudflare-api.md).

## AI commands

| Task | Claude | Codex | What it does |
| --- | --- | --- | --- |
| Commit | `/commit` | `$commit` | Uses `.agents/skills/commit/SKILL.md` to write conventional commits for this monorepo. |
| Create PR | `/pr-create` | `$pr-create` | Uses `.agents/skills/pr-create/SKILL.md` to create a GitHub PR from the current branch and commits. |
| FigJam | `/figjam` | `$figjam` | Uses shared FigJam tooling to read allowed FigJam/Figma files, generate plugin payloads, and update planning/design boards through the private plugin bridge. |
| Grill me | `/grill-me` | `$grill-me` | Uses `.agents/skills/grill-me/SKILL.md` to stress-test a plan or design by walking through decision-tree questions one at a time. |
| Update PR | `/pr-update` | `$pr-update` | Uses `.agents/skills/pr-update/SKILL.md` to refresh an existing PR title and description from branch commits and changes. |

## Running apps

Local app dev commands use Infisical to load Development secrets. Configure the repo first before running them.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Starts every app dev server: Cloudflare Worker API, Autmog archive, Expo mobile, and TanStack Start web. |
| `pnpm dev:web` | Starts the Cloudflare Worker API and the TanStack Start web app. |
| `pnpm dev:ios` | Starts the Cloudflare Worker API and launches the Expo app for iOS. |
| `pnpm dev:android` | Starts the Cloudflare Worker API and launches the Expo app for Android. |
| `pnpm --filter @app/api dev:node` | Starts the legacy local Node Hono server for API debugging outside the Worker runtime. |


## Running tools

| Command | What it does |
| --- | --- |
| `pnpm build` | Builds all apps and packages through Turborepo, using Infisical-backed app commands where configured. |
| `pnpm build:ci` | Builds all apps and packages through Turborepo with environment variables already provided. |
| `pnpm figjam read` | Reads the configured FigJam/Figma file into `.figjam/cache`; run through `infisical run --env=dev --path=/local/figma -- pnpm figjam read`. |
| `pnpm figjam serve-outbox` | Serves validated `.figjam/outbox` payloads to the private local FigJam plugin bridge. |
| `pnpm lint` | Runs Biome linting project-wide, then package-level lint tasks. |
| `pnpm format` | Formats supported files with Biome. |
| `pnpm check` | Runs Biome format/lint/import checks with fixes, then package-level checks. |
| `pnpm typecheck` | Runs TypeScript typechecking across packages and apps. |
| `pnpm test` | Checks local Infisical CLI auth, then runs app tests with Infisical Development secrets and package tests without secrets. |
| `pnpm test:ci` | Runs local/unit tests without Infisical for CI. |
| `pnpm test:watch` | Runs watch-mode app tests with Infisical Development secrets and package tests without secrets. |
| `pnpm test:watch:no-infisical` | Runs watch-mode tests without Infisical where supported. |
