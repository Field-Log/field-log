# Getting Started With Expo

The active Expo app is `apps/mobile`. It uses `expo-dev-client`, so Expo Go is
not the target runtime. Install the native toolchain first, then create a
development build near the end of this setup flow.

## Prerequisites

- Install Node.js and pnpm as documented in the repo README.
- Install Expo tooling through the workspace commands. Do not install a separate
  global Expo CLI for this repo.
- For iOS development, install Xcode and open it once so command-line tools and
  simulators are initialized.
- For Android development, install JDK 17, Android Studio, an Android SDK, and a
  runnable Android target.

## Clerk Native Setup

The app uses Clerk through `@clerk/expo` and stores tokens with
`expo-secure-store`. Apple sign-in is intentionally disabled:

```json
[
  "@clerk/expo",
  {
    "appleSignIn": false
  }
]
```

Configure Google OAuth in Clerk for the iOS bundle identifier
`com.dsabh.fieldlog`, the Android package `com.dsabh.fieldlog`, and the mobile
redirect scheme `fieldlog`.

## iOS Setup

Local iOS development requires macOS, Xcode, and an installed iOS Simulator
runtime. Install Xcode from the App Store or Apple Developer downloads, then open
it once so it can finish first-run setup.

Install or verify the Xcode command-line tools:

```sh
xcode-select --install
xcodebuild -version
xcodebuild -showsdks
```

Open Xcode > Settings > Components and install the iOS Simulator runtime that
matches your Xcode version. You can also install the current iOS platform from
the command line:

```sh
xcodebuild -downloadPlatform iOS
```

Verify that Xcode can see an available simulator:

```sh
xcrun simctl list runtimes
xcrun simctl list devices available
```

## Android Setup

Local Android development requires JDK 17, Android Studio, an Android SDK, and a
runnable Android target. Install JDK 17 before setting up Android Studio:

```sh
brew install --cask zulu@17
```

Install Android Studio from the
[official Android Studio download page](https://developer.android.com/studio) or
with Homebrew on macOS:

```sh
brew install --cask android-studio
```

Open Android Studio once and complete the Setup Wizard. Then open Android Studio
> Settings > Languages & Frameworks > Android SDK. If Android Studio shows an
empty Android SDK Location, click Edit and use the default macOS location:

```sh
/Users/<your-user>/Library/Android/sdk
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

Add Java and Android SDK tools to your shell profile, then reload it:

```zsh
{
  echo ''
  echo '# Mobile native development tools'
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
shell path before running the Android setup commands below.

Gradle uses `ANDROID_HOME` or `ANDROID_SDK_ROOT` to find the Android SDK. If you
need a checkout-local fallback, create the ignored native project file:

```sh
printf 'sdk.dir=%s\n' "$ANDROID_HOME" > apps/mobile/android/local.properties
```

Accept SDK licenses and verify the Android tools:

```sh
yes | sdkmanager --licenses
adb version
emulator -list-avds
```

You do not need a physical Android device for Android development. You need one
runnable Android target:

- an Android emulator/AVD, recommended for local development
- or a physical Android device with USB debugging enabled

To set up the recommended local emulator from the command line, install a default
Apple Silicon system image and create an AVD:

```sh
sdkmanager "system-images;android-36.1;google_apis;arm64-v8a"
avdmanager create avd --name field-log-pixel --package "system-images;android-36.1;google_apis;arm64-v8a" --device "pixel_9"
```

You can also create an emulator from Android Studio > More Actions > Virtual
Device Manager, or connect a physical Android device with USB debugging enabled.
See the
[Expo Android Studio Emulator guide](https://docs.expo.dev/workflow/android-studio-emulator/)
for the full platform-specific walkthrough.

Verify that the AVD exists, then run the repo Android environment check:

```sh
emulator -list-avds
pnpm dev:doctor:android
```

You can rerun the Android environment check at any time:

```sh
pnpm dev:doctor:android
```

## Development Builds

After the native toolchain is installed, build and install the local development
client with the native toolchain on your machine:

```sh
pnpm dev:ios:no-api
pnpm dev:android:no-api
```

### Troubleshooting stale development clients

Rebuild the development client any time mobile native dependencies or Expo
plugins change. If `pnpm dev:ios` starts Metro but the app fails with an error
like `Cannot find native module 'ExpoSecureStore'`, stop Metro and rebuild the
iOS development client:

```sh
pnpm dev:ios:no-api
pnpm dev:ios
```

If the error persists, uninstall the old simulator app, then rebuild and launch
the development client again:

```sh
xcrun simctl uninstall booted com.dsabh.fieldlog
pnpm dev:ios:no-api
pnpm dev:ios
```

Use the same pattern for Android with `pnpm dev:android:no-api` followed by
`pnpm dev:android`.

If `pnpm dev:ios:no-api` fails with `xcodebuild` error code 70 and says it is
`Unable to find a destination matching the provided destination specifier`, check
that Xcode has a simulator runtime installed for its current iOS platform.

```sh
xcodebuild -version
xcodebuild -showsdks
xcrun simctl list runtimes
xcrun simctl list devices available
```

To build with EAS instead, install and authenticate the EAS CLI, then use the
development profiles from the repo root. EAS builds run on Expo's paid cloud
build service and produce a development build artifact; `dev:*:no-api` builds
run on your machine and install directly to a local simulator, emulator, or
device.

```sh
pnpm dev:eas:android
pnpm dev:eas:ios
```

The `development` Android profile can be installed on an Android device or
emulator. The `development-simulator` iOS profile is for iOS Simulator. For a
physical iPhone, create an iOS development build with the `development` profile
and Apple signing credentials.

Production mobile releases do not use EAS Build. See
[mobile-release-fastlane.md](./mobile-release-fastlane.md) for the fastlane
release path.

## Run the app

Once the mobile development build is installed, start local development from the
repo root:

```sh
pnpm dev:expo
```

This starts the Hono API and the Expo dev-client Metro server. Use `pnpm dev:ios`
or `pnpm dev:android` when you want the command to launch a specific installed
mobile target.

## Validation

After mobile code changes, run the repo validation commands:

```sh
pnpm format
pnpm test
pnpm lint
pnpm typecheck
```

For documentation-only changes, run:

```sh
pnpm format
```
