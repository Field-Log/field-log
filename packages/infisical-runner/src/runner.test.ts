import { describe, expect, it } from "vitest";
import {
  buildInfisicalRunArgs,
  getSecretPaths,
  parseCliArguments,
  RunnerError,
  validateSecretPaths,
} from "./runner.js";

describe("parseCliArguments", () => {
  it("parses the app, command, and wrapped command", () => {
    expect(parseCliArguments(["web", "dev", "--", "vite", "dev"])).toEqual({
      app: "web",
      command: "dev",
      commandArgs: ["vite", "dev"],
    });
  });

  it("requires a separator before the wrapped command", () => {
    expect(() => parseCliArguments(["web", "dev", "vite", "dev"])).toThrow(
      RunnerError,
    );
  });
});

describe("buildInfisicalRunArgs", () => {
  it("builds Infisical args with common and app command paths", () => {
    expect(
      buildInfisicalRunArgs({
        app: "api",
        command: "test",
        commandArgs: ["vitest", "run"],
        repoRoot: "/repo",
      }),
    ).toEqual([
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/common",
      "--",
      "infisical",
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/clerk",
      "--",
      "infisical",
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/clerk/server",
      "--",
      "infisical",
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/neon/server",
      "--",
      "vitest",
      "run",
    ]);
  });

  it("rejects unknown app commands", () => {
    expect(() =>
      buildInfisicalRunArgs({
        app: "web",
        command: "deploy",
        commandArgs: ["vite", "build"],
        repoRoot: "/repo",
      }),
    ).toThrow(RunnerError);
  });

  it("wraps web commands with Vite Clerk aliases", () => {
    expect(
      buildInfisicalRunArgs({
        app: "web",
        command: "build",
        commandArgs: ["vite", "build"],
        repoRoot: "/repo",
      }),
    ).toEqual([
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/common",
      "--",
      "infisical",
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/clerk",
      "--",
      "infisical",
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/clerk/server",
      "--",
      "infisical",
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/neon/server",
      "--",
      "infisical",
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/logging",
      "--",
      "infisical",
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/axiom/server",
      "--",
      "tsx",
      "/repo/packages/infisical-runner/src/env-alias-runner.ts",
      '[{"from":"CLERK_PUBLISHABLE_KEY","to":"VITE_CLERK_PUBLISHABLE_KEY"},{"from":"CLERK_SIGN_IN_URL","to":"VITE_CLERK_SIGN_IN_URL"},{"from":"CLERK_SIGN_UP_URL","to":"VITE_CLERK_SIGN_UP_URL"},{"from":"LOG_PROXY_URL","to":"VITE_LOG_PROXY_URL"},{"from":"LOG_PROXY_CLIENT_KEY","to":"VITE_LOG_PROXY_CLIENT_KEY"}]',
      "--",
      "vite",
      "build",
    ]);
  });

  it("builds logger live test args with automated Axiom and logging paths", () => {
    expect(
      buildInfisicalRunArgs({
        app: "logger",
        command: "test:axiom",
        commandArgs: ["tsx", "packages/logger/integration/axiom-live.ts"],
        infisicalProjectId: "project-1",
        repoRoot: "/repo",
      }),
    ).toEqual([
      "run",
      "--projectId=project-1",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/common",
      "--",
      "infisical",
      "run",
      "--projectId=project-1",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/logging",
      "--",
      "infisical",
      "run",
      "--projectId=project-1",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/axiom/automated-tests",
      "--",
      "tsx",
      "packages/logger/integration/axiom-live.ts",
    ]);
  });

  it("builds GitHub Discord notification args", () => {
    expect(
      buildInfisicalRunArgs({
        app: "github",
        command: "discord-notify",
        commandArgs: [
          "pnpm",
          "--filter",
          "@repo/github-discord-notifier",
          "notify",
        ],
        repoRoot: "/repo",
      }),
    ).toEqual([
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/common",
      "--",
      "infisical",
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/github/discord",
      "--",
      "pnpm",
      "--filter",
      "@repo/github-discord-notifier",
      "notify",
    ]);
  });
});

describe("secret path policy", () => {
  it("deduplicates the common path", () => {
    expect(
      getSecretPaths({
        allowServerSecrets: false,
        paths: ["/common", "/clerk"],
      }),
    ).toEqual(["/common", "/clerk"]);
  });

  it("rejects server-only paths for client commands", () => {
    expect(() =>
      validateSecretPaths("web", "dev", {
        allowServerSecrets: false,
        paths: ["/clerk/server"],
      }),
    ).toThrow(RunnerError);
  });
});
