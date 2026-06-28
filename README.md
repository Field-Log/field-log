# machinedpens.info

Monorepo for the machinedpens.info apps and shared packages.

## AI commands

| Task | Claude | Codex | What it does |
| --- | --- | --- | --- |
| Commit | `/commit` | `$commit` | Uses `.agents/skills/commit/SKILL.md` to write conventional commits for this monorepo. |
| Create PR | `/pr-create` | `$pr-create` | Uses `.agents/skills/pr-create/SKILL.md` to create a GitHub PR from the current branch and commits. |

## Running apps

| Command | What it does |
| --- | --- |
| `pnpm dev` | Starts every app dev server: API, Autmog archive, Expo mobile, and TanStack Start web. |
| `pnpm dev:web` | Starts the Hono API and the TanStack Start web app. |
| `pnpm dev:ios` | Starts the Hono API and launches the Expo app for iOS. |
| `pnpm dev:android` | Starts the Hono API and launches the Expo app for Android. |

## Running tools

| Command | What it does |
| --- | --- |
| `pnpm build` | Builds all apps and packages through Turborepo. |
| `pnpm lint` | Runs Biome linting project-wide, then package-level lint tasks. |
| `pnpm format` | Formats supported files with Biome. |
| `pnpm check` | Runs Biome format/lint/import checks with fixes, then package-level checks. |
| `pnpm typecheck` | Runs TypeScript typechecking across packages and apps. |
| `pnpm test` | Runs all test suites. |
| `pnpm test:watch` | Runs test suites in watch mode where supported. |
