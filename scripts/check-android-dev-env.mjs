#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

const checks = [];

const sdkRoot =
  process.env.ANDROID_HOME ??
  process.env.ANDROID_SDK_ROOT ??
  join(homedir(), "Library", "Android", "sdk");

function run(command, args) {
  return spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function addCheck(label, ok, detail = "") {
  checks.push({ label, ok, detail });
}

function printChecks() {
  for (const check of checks) {
    const prefix = check.ok ? "OK  " : "MISS";
    console.log(
      `${prefix} ${check.label}${check.detail ? ` - ${check.detail}` : ""}`,
    );
  }
}

function fail(message) {
  if (checks.length > 0) {
    printChecks();
    console.log("");
  }
  console.error(message);
  process.exit(1);
}

const javaHome =
  process.env.JAVA_HOME ||
  (platform() === "darwin"
    ? run("/usr/libexec/java_home", ["-v", "17"]).stdout.trim()
    : "");
const java = run("java", ["-version"]);
const javaInstalled = java.status === 0;

addCheck(
  "Java runtime",
  javaInstalled,
  javaInstalled ? "java -version works" : "",
);
addCheck("JAVA_HOME", Boolean(javaHome), javaHome);

if (!javaInstalled || !javaHome) {
  fail(
    [
      "Install JDK 17 before checking Android SDK tools.",
      "",
      "macOS:",
      "  brew install --cask zulu@17",
      "  export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home",
    ].join("\n"),
  );
}

if (platform() === "darwin") {
  addCheck(
    "Android Studio app",
    existsSync("/Applications/Android Studio.app"),
    "/Applications/Android Studio.app",
  );
}

addCheck("Android SDK root", existsSync(sdkRoot), sdkRoot);

const buildToolsDir = join(sdkRoot, "build-tools");
const buildTools = existsSync(buildToolsDir) ? readdirSync(buildToolsDir) : [];
addCheck(
  "Android SDK Build-Tools",
  buildTools.length > 0,
  buildTools.length > 0 ? buildTools.join(", ") : buildToolsDir,
);

const adbPath = join(sdkRoot, "platform-tools", "adb");
const emulatorPath = join(sdkRoot, "emulator", "emulator");
const sdkmanagerPath = join(
  sdkRoot,
  "cmdline-tools",
  "latest",
  "bin",
  "sdkmanager",
);
const avdmanagerPath = join(
  sdkRoot,
  "cmdline-tools",
  "latest",
  "bin",
  "avdmanager",
);

let installedPackages = "";
if (existsSync(sdkmanagerPath)) {
  const result = run(sdkmanagerPath, ["--list_installed"]);
  if (result.status === 0) {
    installedPackages = result.stdout;
  }
}

const platformsDir = join(sdkRoot, "platforms");
const installedPlatforms = existsSync(platformsDir)
  ? readdirSync(platformsDir).filter((entry) => entry.startsWith("android-"))
  : [];
const hasAndroid36Platform =
  installedPlatforms.some((entry) => entry.startsWith("android-36")) ||
  installedPackages.includes("platforms;android-36");

addCheck("Android SDK Platform-Tools", existsSync(adbPath), adbPath);
addCheck("Android Emulator", existsSync(emulatorPath), emulatorPath);
addCheck(
  "Android SDK Command-line Tools",
  existsSync(sdkmanagerPath),
  sdkmanagerPath,
);
addCheck("AVD Manager", existsSync(avdmanagerPath), avdmanagerPath);

let avds = [];
if (existsSync(emulatorPath)) {
  const result = run(emulatorPath, ["-list-avds"]);
  avds = result.status === 0 ? result.stdout.split("\n").filter(Boolean) : [];
}

let connectedDevices = [];
if (existsSync(adbPath)) {
  const result = run(adbPath, ["devices"]);
  connectedDevices =
    result.status === 0
      ? result.stdout
          .split("\n")
          .slice(1)
          .map((line) => line.trim())
          .filter((line) => line.endsWith("\tdevice"))
      : [];
}

const systemImagesDir = join(sdkRoot, "system-images");
const hasSystemImages = existsSync(systemImagesDir);
addCheck(
  "Android SDK Platform 36.x",
  hasAndroid36Platform,
  installedPlatforms.length > 0 ? installedPlatforms.join(", ") : platformsDir,
);
addCheck(
  "Android emulator image or physical device",
  hasSystemImages || avds.length > 0 || connectedDevices.length > 0,
  hasSystemImages
    ? systemImagesDir
    : connectedDevices.length > 0
      ? `Devices: ${connectedDevices.join(", ")}`
      : "install a system image or connect a USB-debugging Android device",
);
addCheck(
  "Runnable Android target",
  avds.length > 0 || connectedDevices.length > 0,
  avds.length > 0
    ? `AVDs: ${avds.join(", ")}`
    : connectedDevices.length > 0
      ? `Devices: ${connectedDevices.join(", ")}`
      : "create an AVD or connect a USB-debugging Android device",
);

if (installedPackages) {
  addCheck(
    "sdkmanager sees platform-tools",
    installedPackages.includes("platform-tools"),
  );
  addCheck("sdkmanager sees emulator", installedPackages.includes("emulator"));
  addCheck("sdkmanager sees Android 36.x platform", hasAndroid36Platform);
}

printChecks();

const failed = checks.filter((check) => !check.ok);
if (failed.length > 0) {
  console.error("");
  console.error(
    `Android development environment is incomplete: ${failed.length} check(s) failed.`,
  );
  if (!hasSystemImages && connectedDevices.length === 0) {
    console.error("");
    console.error("Install an Android emulator system image:");
    console.error(
      '  sdkmanager "system-images;android-36.1;google_apis;arm64-v8a"',
    );
  }
  if (avds.length === 0 && connectedDevices.length === 0) {
    console.error("");
    console.error("Create a runnable Android virtual device:");
    console.error(
      '  avdmanager create avd --name field-log-pixel --package "system-images;android-36.1;google_apis;arm64-v8a" --device "pixel_9"',
    );
  }
  process.exit(1);
}

console.log("");
console.log("Android development environment checks passed.");
