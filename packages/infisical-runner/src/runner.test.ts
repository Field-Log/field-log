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
      "--path=/clerk",
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
});

describe("secret path policy", () => {
  it("deduplicates the common path", () => {
    expect(
      getSecretPaths({
        client: true,
        paths: ["/common", "/clerk"],
      }),
    ).toEqual(["/common", "/clerk"]);
  });

  it("rejects server-only paths for client commands", () => {
    expect(() =>
      validateSecretPaths("web", "dev", {
        client: true,
        paths: ["/clerk/server"],
      }),
    ).toThrow(RunnerError);
  });
});
