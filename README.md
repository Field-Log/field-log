# field-log.app

Monorepo for the field-log.app apps and shared packages.

## Getting started

### Prerequisites

- Node.js 22
- Corepack, enabled with `corepack enable`
- pnpm 10.33.2, provided by the repo `packageManager` setting
- Infisical CLI access to the `Field Log` project

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

4. Test local Infisical access:

   ```sh
   infisical run --env=dev --path=/local/smoke -- node -e "console.log(process.env.TEST)"
   ```

   You should see:

   ```txt
   Infisical working
   ```

### Install deps and set up the repo after Infisical

After cloning the repo and confirming Infisical access, install dependencies from
the repo root:

```sh
corepack enable
pnpm install
```

Run the baseline checks before starting app work:

```sh
pnpm format
pnpm lint
pnpm typecheck
```

### Developing mobile apps with Expo

If you are working on the mobile app, install a development build before using
the mobile dev commands. The mobile app uses `expo-dev-client`, so Expo Go is not
the target runtime.

To build and install locally, use the native toolchain on your machine:

```sh
pnpm dev:ios:no-api
pnpm dev:android:no-api
```

Local iOS builds require Xcode on macOS. Local Android builds require Android
Studio and an Android SDK/emulator.

For Android, install JDK 17 before setting up Android Studio. On macOS:

```sh
brew install --cask zulu@17
export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
```

Then install Android Studio from the
[official Android Studio download page](https://developer.android.com/studio) or
with Homebrew on macOS:

```sh
brew install --cask android-studio
```

Open Android Studio once and complete the Setup Wizard. Then open Settings >
Languages & Frameworks > Android SDK. If Android Studio shows an empty Android
SDK Location, click Edit and use the default macOS location:

```sh
/Users/<your-user>/Library/Android/sdk
```

On this machine, that is:

```sh
/Users/royanger/Library/Android/sdk
```

The setup wizard installs these by default:

- Android SDK Platform 36.1 or newer
- Android SDK Build-Tools
- Android SDK Platform-Tools
- Android Emulator

In Android Studio > Settings > Languages & Frameworks > Android SDK > SDK Tools,
also confirm these are installed:

- Android SDK Command-line Tools (latest)
- at least one Android 36.1 or newer system image, if you plan to use an emulator

You do not need a physical Android device for Android development. You need one
runnable Android target:

- an Android emulator/AVD, recommended for local development
- or a physical Android device with USB debugging enabled

Add the Android SDK tools to your shell profile and reload it:

```sh
{
  echo ''
  echo '# Android development tools'
  echo 'export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home'
  echo 'export ANDROID_HOME=$HOME/Library/Android/sdk'
  echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin'
  echo 'export PATH=$PATH:$ANDROID_HOME/emulator'
  echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools'
} >> ~/.zshrc

source ~/.zshrc
```

The `sdkmanager` and `avdmanager` commands come from
`$ANDROID_HOME/cmdline-tools/latest/bin`, so that directory must be on your
shell path before running the setup commands below.

Accept SDK licenses and verify the Android tools:

```sh
yes | sdkmanager --licenses
adb version
emulator -list-avds
```

You can rerun the repo Android environment check at any time:

```sh
pnpm dev:doctor:android
```

To set up the recommended local emulator, install a default Apple Silicon system
image and create an AVD:

```sh
sdkmanager "system-images;android-36.1;google_apis;arm64-v8a"
avdmanager create avd --name field-log-pixel --package "system-images;android-36.1;google_apis;arm64-v8a" --device "pixel_9"
```

Verify that the AVD exists, then rerun the repo doctor:

```sh
emulator -list-avds
pnpm dev:doctor:android
```

Create an emulator from Android Studio > More Actions > Virtual Device Manager,
or connect a physical Android device with USB debugging enabled. See the
[Expo Android Studio Emulator guide](https://docs.expo.dev/workflow/android-studio-emulator/)
for the full platform-specific walkthrough.

If `pnpm dev:ios:no-api` fails with `xcodebuild` error code 70 and says it is
`Unable to find a destination matching the provided destination specifier`, check
that Xcode has a simulator runtime installed for its current iOS platform. This
can happen when `xcrun simctl` lists an older simulator, but Xcode expects a
newer platform such as iOS 26.5.

```sh
xcodebuild -version
xcodebuild -showsdks
xcrun simctl list runtimes
xcrun simctl list devices available
```

Install the matching iOS simulator runtime from the command line:

```sh
xcodebuild -downloadPlatform iOS
```

You can also install it in Xcode from Settings > Components by downloading the
matching iOS Simulator platform. After installation, rerun:

```sh
pnpm dev:ios:no-api
```

To build with EAS instead, install and authenticate the EAS CLI, then use the
development profiles from the repo root. EAS builds run on Expo's cloud build
service and produce a development build artifact; `dev:*:no-api` builds run on
your machine and install directly to a local simulator, emulator, or device.

```sh
pnpm dev:eas:android
pnpm dev:eas:ios
```

The `development` Android profile can be installed on an Android device or
emulator. The `development-simulator` iOS profile is for iOS Simulator. For a
physical iPhone, create an iOS development build with the `development` profile
and Apple signing credentials.

Once the mobile development build is installed, start local development from the
repo root:

```sh
pnpm dev:expo
```

This starts the Hono API and the Expo dev-client Metro server. Use `pnpm dev:ios`
or `pnpm dev:android` when you want the command to launch a specific installed
mobile target. For web-only work, use:

```sh
pnpm dev:web
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
| `pnpm dev` | Starts every app dev server: API, Autmog archive, Expo mobile, and TanStack Start web. |
| `pnpm dev:web` | Starts the Hono API and the TanStack Start web app. |
| `pnpm dev:ios` | Starts the Hono API and launches the Expo app for iOS. |
| `pnpm dev:android` | Starts the Hono API and launches the Expo app for Android. |
| `pnpm dev:expo` | Starts the Hono API and the interactive Expo dev-client Metro server. |
| `pnpm dev:ios:no-api` | Builds, installs, and launches the iOS development build with the local native toolchain, without starting the API. |
| `pnpm dev:android:no-api` | Builds, installs, and launches the Android development build with the local native toolchain, without starting the API. |
| `pnpm dev:eas:android` | Starts an EAS Android development build using the `development` profile. |
| `pnpm dev:eas:ios` | Starts an EAS iOS Simulator development build using the `development-simulator` profile. |
| `pnpm --filter @app/api dev:node` | Starts the legacy local Node Hono server for API debugging outside the Worker runtime. |


## Running tools

Local `pnpm test` requires `infisical login` because it checks Infisical CLI auth
before running app tests. Use `pnpm test:ci` for the CI-style test run without
Infisical.

| Command | What it does |
| --- | --- |
| `pnpm build` | Builds all apps and packages through Turborepo, using Infisical-backed app commands where configured. |
| `pnpm build:ci` | Builds all apps and packages through Turborepo with environment variables already provided. |
| `pnpm dev:doctor:android` | Checks that JDK 17, Android Studio, Android SDK tools, an emulator image, and a runnable Android target are available. |
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
