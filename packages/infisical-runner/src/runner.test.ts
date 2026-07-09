import { describe, expect, it } from "vitest";
import {
  buildInfisicalRunArgs,
  getInfisicalAuthCheckError,
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
  it("builds Infisical args with the API target path", () => {
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
      "--path=/apps/api",
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

  it("builds API deploy args with Cloudflare tool credentials", () => {
    expect(
      buildInfisicalRunArgs({
        app: "api",
        command: "deploy",
        commandArgs: [
          "pnpm",
          "dlx",
          "wrangler",
          "deploy",
          "--config",
          "wrangler.jsonc",
        ],
        repoRoot: "/repo",
      }),
    ).toEqual([
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/tools/cloudflare",
      "--",
      "pnpm",
      "dlx",
      "wrangler",
      "deploy",
      "--config",
      "wrangler.jsonc",
    ]);
  });

  it("builds web commands from the web target path", () => {
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
      "--path=/apps/web",
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
      "--path=/tools/logger-axiom-test",
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
          "@package/github-discord-notifier",
          "notify",
        ],
        repoRoot: "/repo",
      }),
    ).toEqual([
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/tools/github-discord-notifier",
      "--",
      "pnpm",
      "--filter",
      "@package/github-discord-notifier",
      "notify",
    ]);
  });
});

describe("infisical auth checks", () => {
  it("surfaces signed-out CLI errors with login instructions", () => {
    const error = getInfisicalAuthCheckError(
      "error: we couldn't find your logged in details, try running [infisical login] then try again",
    );

    expect(error).toBeInstanceOf(RunnerError);
    expect(error.message).toContain("Infisical CLI is not signed in.");
    expect(error.message).toContain("infisical login");
  });
});

describe("secret path policy", () => {
  it("deduplicates configured paths", () => {
    expect(
      getSecretPaths({
        allowServerSecrets: false,
        paths: ["/apps/web", "/apps/web"],
      }),
    ).toEqual(["/apps/web"]);
  });

  it("rejects server-only paths for client commands", () => {
    expect(() =>
      validateSecretPaths("web", "dev", {
        allowServerSecrets: false,
        paths: ["/apps/server/only"],
      }),
    ).toThrow(RunnerError);
  });
});
