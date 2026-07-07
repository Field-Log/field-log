# machinedpens.info

Monorepo for the machinedpens.info apps and shared packages.

## Getting started 

### Installing and configuring Infisical

This repo uses the Infisical project `Field Log` for local Development secrets. Deployment secrets should be delivered by Infisical App Connections into the chosen host environment instead of wrapping deployment commands with the Infisical CLI.

See [Environment Variables](docs/ENVIRONMENT_VARIABLES.md) for app-specific
runtime variables and deployment requirements.

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

4. Test local Infisical access:

   ```sh
   infisical run --env=dev --path=/local/smoke -- node -e "console.log(process.env.TEST)"
   ```

   You should see:

   ```txt
   Infisical working
   ```


## AI commands

| Task | Claude | Codex | What it does |
| --- | --- | --- | --- |
| Commit | `/commit` | `$commit` | Uses `.agents/skills/commit/SKILL.md` to write conventional commits for this monorepo. |
| Create PR | `/pr-create` | `$pr-create` | Uses `.agents/skills/pr-create/SKILL.md` to create a GitHub PR from the current branch and commits. |
| Grill me | `/grill-me` | `$grill-me` | Uses `.agents/skills/grill-me/SKILL.md` to stress-test a plan or design by walking through decision-tree questions one at a time. |
| Update PR | `/pr-update` | `$pr-update` | Uses `.agents/skills/pr-update/SKILL.md` to refresh an existing PR title and description from branch commits and changes. |

## Running apps

Local app dev commands use Infisical to load Development secrets. Configure the repo first before running them.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Starts every app dev server: API, Autmog archive, Expo mobile, and TanStack Start web. |
| `pnpm dev:web` | Starts the Hono API and the TanStack Start web app. |
| `pnpm dev:ios` | Starts the Hono API and launches the Expo app for iOS. |
| `pnpm dev:android` | Starts the Hono API and launches the Expo app for Android. |


## Running tools

| Command | What it does |
| --- | --- |
| `pnpm build` | Builds all apps and packages through Turborepo, using Infisical-backed app commands where configured. |
| `pnpm build:ci` | Builds all apps and packages through Turborepo with environment variables already provided. |
| `pnpm lint` | Runs Biome linting project-wide, then package-level lint tasks. |
| `pnpm format` | Formats supported files with Biome. |
| `pnpm check` | Runs Biome format/lint/import checks with fixes, then package-level checks. |
| `pnpm typecheck` | Runs TypeScript typechecking across packages and apps. |
| `pnpm test` | Runs app tests with Infisical Development secrets and package tests without secrets. |
| `pnpm test:ci` | Runs local/unit tests without Infisical for CI. |
| `pnpm test:watch` | Runs watch-mode app tests with Infisical Development secrets and package tests without secrets. |
| `pnpm test:watch:no-infisical` | Runs watch-mode tests without Infisical where supported. |
