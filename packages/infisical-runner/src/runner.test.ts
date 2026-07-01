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
      "tsx",
      "/repo/packages/infisical-runner/src/env-alias-runner.ts",
      '[{"from":"CLERK_PUBLISHABLE_KEY","to":"VITE_CLERK_PUBLISHABLE_KEY"},{"from":"CLERK_SIGN_IN_URL","to":"VITE_CLERK_SIGN_IN_URL"},{"from":"CLERK_SIGN_UP_URL","to":"VITE_CLERK_SIGN_UP_URL"}]',
      "--",
      "vite",
      "build",
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
