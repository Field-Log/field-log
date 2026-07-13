#!/usr/bin/env node

import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mobileDir = resolve(rootDir, "apps/mobile");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const mobileScripts = {
  android: "android",
  expo: "start",
  ios: "ios",
};

const target = process.argv[2];
const mobileScript = mobileScripts[target];

if (!mobileScript) {
  console.error(
    "Usage: node scripts/dev-mobile-with-api.mjs <expo|ios|android>",
  );
  process.exit(1);
}

let apiProcess;
let mobileProcess;
let shuttingDown = false;

function spawnCommand(args, options = {}) {
  const child = spawn(pnpm, args, {
    cwd: rootDir,
    stdio: "inherit",
    ...options,
  });
  child.devDetached = Boolean(options.detached);

  child.on("error", (error) => {
    console.error(error);
    shutdown(1);
  });

  return child;
}

function waitForExit(child) {
  return new Promise((resolveExit) => {
    child.on("exit", (code, signal) => {
      resolveExit({ code, signal });
    });
  });
}

function stopProcess(child) {
  if (!child || child.killed || child.exitCode !== null) {
    return;
  }

  try {
    if (child.devDetached && process.platform !== "win32") {
      process.kill(-child.pid, "SIGTERM");
      return;
    }

    child.kill("SIGTERM");
  } catch (error) {
    if (error.code !== "ESRCH") {
      console.error(error);
    }
  }
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  stopProcess(mobileProcess);
  stopProcess(apiProcess);
  process.exitCode = exitCode;
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    shutdown(130);
  });
}

const loggerBuild = spawnCommand(["--filter", "@package/logger", "build"]);
const loggerResult = await waitForExit(loggerBuild);

if (loggerResult.code !== 0) {
  process.exit(loggerResult.code ?? 1);
}

apiProcess = spawnCommand(["--filter", "@app/api", "dev"], {
  detached: process.platform !== "win32",
  stdio: ["ignore", "inherit", "inherit"],
});

apiProcess.on("exit", (code, signal) => {
  if (!shuttingDown && code !== 0) {
    console.error(`API dev server exited with ${signal ?? `code ${code}`}.`);
    shutdown(code ?? 1);
  }
});

mobileProcess = spawnCommand(["run", mobileScript], {
  cwd: mobileDir,
});

const mobileResult = await waitForExit(mobileProcess);
shutdown(mobileResult.code ?? (mobileResult.signal ? 130 : 0));
