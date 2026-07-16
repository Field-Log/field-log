import { describe, expect, it } from "vitest";
import {
  buildInfisicalRunArgs,
  getInfisicalAuthCheckError,
  getSecretPaths,
  parseCliArguments,
  RunnerError,
  validateSecretPaths,
} from "./runner.js";

function getEnvAliasRunnerOptions(args: readonly string[]) {
  const runnerIndex = args.findIndex((arg) =>
    arg.endsWith("/packages/infisical-runner/src/env-alias-runner.ts"),
  );

  if (runnerIndex === -1) {
    throw new Error("env-alias-runner was not included in args.");
  }

  return JSON.parse(args[runnerIndex + 1] ?? "{}") as {
    databaseUrlUserOverride?: boolean;
    databaseUrlUserOverridePath?: string;
    environmentSlug?: string;
    secretPaths?: string[];
  };
}

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
    const args = buildInfisicalRunArgs({
      app: "api",
      command: "test",
      commandArgs: ["vitest", "run"],
      repoRoot: "/repo",
    });

    expect(args).toEqual([
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/apps/api",
      "--",
      "tsx",
      "/repo/packages/infisical-runner/src/env-alias-runner.ts",
      expect.stringContaining("databaseUrlUserOverride"),
      "--",
      "vitest",
      "run",
    ]);
    expect(getEnvAliasRunnerOptions(args)).toMatchObject({
      databaseUrlUserOverride: true,
      databaseUrlUserOverridePath: "/local/database",
      environmentSlug: "dev",
      secretPaths: ["/apps/api"],
    });
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
      "tsx",
      "/repo/packages/infisical-runner/src/env-alias-runner.ts",
      expect.stringContaining("databaseUrlUserOverride"),
      "--",
      "vite",
      "build",
    ]);
  });

  it("builds scraper source commands from the scraper target path", () => {
    expect(
      buildInfisicalRunArgs({
        app: "scraper",
        command: "scrape",
        commandArgs: ["tsx", "apps/scraper/src/cli.ts", "scrape", "autmog"],
        repoRoot: "/repo",
      }),
    ).toEqual([
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/apps/scraper",
      "--",
      "tsx",
      "/repo/packages/infisical-runner/src/env-alias-runner.ts",
      expect.stringContaining("databaseUrlUserOverride"),
      "--",
      "tsx",
      "apps/scraper/src/cli.ts",
      "scrape",
      "autmog",
    ]);
  });

  it("builds scraper dead-letter processor commands from the scraper target path", () => {
    expect(
      buildInfisicalRunArgs({
        app: "scraper",
        command: "process:dead-letter",
        commandArgs: ["tsx", "apps/scraper/src/cli.ts", "process:dead-letter"],
        repoRoot: "/repo",
      }),
    ).toEqual([
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/apps/scraper",
      "--",
      "tsx",
      "/repo/packages/infisical-runner/src/env-alias-runner.ts",
      expect.stringContaining("databaseUrlUserOverride"),
      "--",
      "tsx",
      "apps/scraper/src/cli.ts",
      "process:dead-letter",
    ]);
  });

  it("builds mobile default builds with development app secrets", () => {
    expect(
      buildInfisicalRunArgs({
        app: "mobile",
        command: "build",
        commandArgs: ["expo", "export", "--platform", "all"],
        repoRoot: "/repo",
      }),
    ).toEqual([
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/apps/mobile",
      "--",
      "tsx",
      "/repo/packages/infisical-runner/src/env-alias-runner.ts",
      expect.stringContaining("EXPO_PUBLIC_FIREBASE_API_KEY"),
      "--",
      "expo",
      "export",
      "--platform",
      "all",
    ]);
  });

  it("builds mobile production builds with production app secrets", () => {
    expect(
      buildInfisicalRunArgs({
        app: "mobile",
        command: "build:prod",
        commandArgs: ["expo", "export", "--platform", "all"],
        repoRoot: "/repo",
      }),
    ).toEqual([
      "run",
      "--project-config-dir=/repo",
      "--env=prod",
      "--path=/apps/mobile",
      "--",
      "tsx",
      "/repo/packages/infisical-runner/src/env-alias-runner.ts",
      expect.stringContaining("EXPO_PUBLIC_FIREBASE_API_KEY"),
      "--",
      "expo",
      "export",
      "--platform",
      "all",
    ]);
  });

  it("builds mobile preview builds with preview app secrets", () => {
    expect(
      buildInfisicalRunArgs({
        app: "mobile",
        command: "build:preview",
        commandArgs: ["expo", "export", "--platform", "all"],
        repoRoot: "/repo",
      }),
    ).toEqual([
      "run",
      "--project-config-dir=/repo",
      "--env=preview",
      "--path=/apps/mobile",
      "--",
      "tsx",
      "/repo/packages/infisical-runner/src/env-alias-runner.ts",
      expect.stringContaining("EXPO_PUBLIC_FIREBASE_API_KEY"),
      "--",
      "expo",
      "export",
      "--platform",
      "all",
    ]);
  });

  it("builds mobile fastlane production builds with tool and app secrets", () => {
    expect(
      buildInfisicalRunArgs({
        app: "mobile",
        command: "fastlane:build:prod",
        commandArgs: ["bundle", "exec", "fastlane", "android", "build"],
        repoRoot: "/repo",
      }),
    ).toEqual([
      "run",
      "--project-config-dir=/repo",
      "--env=prod",
      "--path=/tools/fastlane",
      "--",
      "infisical",
      "run",
      "--project-config-dir=/repo",
      "--env=prod",
      "--path=/apps/mobile",
      "--",
      "tsx",
      "/repo/packages/infisical-runner/src/env-alias-runner.ts",
      expect.stringContaining("EXPO_PUBLIC_FIREBASE_API_KEY"),
      "--",
      "bundle",
      "exec",
      "fastlane",
      "android",
      "build",
    ]);
  });

  it("builds mobile fastlane production submissions with tool secrets only", () => {
    expect(
      buildInfisicalRunArgs({
        app: "mobile",
        command: "fastlane:submit:prod",
        commandArgs: ["bundle", "exec", "fastlane", "ios", "submit"],
        repoRoot: "/repo",
      }),
    ).toEqual([
      "run",
      "--project-config-dir=/repo",
      "--env=prod",
      "--path=/tools/fastlane",
      "--",
      "bundle",
      "exec",
      "fastlane",
      "ios",
      "submit",
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

  it("builds mobile web args with Expo public aliases from the mobile path", () => {
    expect(
      buildInfisicalRunArgs({
        app: "mobile",
        command: "web",
        commandArgs: ["expo", "start", "--web"],
        repoRoot: "/repo",
      }),
    ).toEqual([
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/apps/mobile",
      "--",
      "tsx",
      "/repo/packages/infisical-runner/src/env-alias-runner.ts",
      expect.stringContaining("EXPO_PUBLIC_FIREBASE_API_KEY"),
      "--",
      "expo",
      "start",
      "--web",
    ]);
  });

  it("builds database migrate args with the database URL user override", () => {
    const args = buildInfisicalRunArgs({
      app: "database",
      command: "db:migrate",
      commandArgs: ["drizzle-kit", "migrate", "--config=drizzle.config.ts"],
      repoRoot: "/repo",
    });

    expect(args).toEqual([
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/apps/api",
      "--",
      "tsx",
      "/repo/packages/infisical-runner/src/env-alias-runner.ts",
      expect.stringContaining("databaseUrlUserOverride"),
      "--",
      "drizzle-kit",
      "migrate",
      "--config=drizzle.config.ts",
    ]);
    expect(getEnvAliasRunnerOptions(args)).toMatchObject({
      databaseUrlUserOverride: true,
      databaseUrlUserOverridePath: "/local/database",
      environmentSlug: "dev",
      secretPaths: ["/apps/api"],
    });
  });

  it("builds database studio args with the database URL user override", () => {
    const args = buildInfisicalRunArgs({
      app: "database",
      command: "db:studio",
      commandArgs: [
        "drizzle-kit",
        "studio",
        "--config=drizzle.config.ts",
        "--host=127.0.0.1",
        "--port=4009",
      ],
      repoRoot: "/repo",
    });

    expect(args).toEqual([
      "run",
      "--project-config-dir=/repo",
      "--env=dev",
      "--path=/apps/api",
      "--",
      "tsx",
      "/repo/packages/infisical-runner/src/env-alias-runner.ts",
      expect.stringContaining("databaseUrlUserOverride"),
      "--",
      "drizzle-kit",
      "studio",
      "--config=drizzle.config.ts",
      "--host=127.0.0.1",
      "--port=4009",
    ]);
    expect(getEnvAliasRunnerOptions(args)).toMatchObject({
      databaseUrlUserOverride: true,
      databaseUrlUserOverridePath: "/local/database",
      environmentSlug: "dev",
      secretPaths: ["/apps/api"],
    });
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
