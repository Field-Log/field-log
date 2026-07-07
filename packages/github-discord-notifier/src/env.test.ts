import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGitHubDiscordNotifierEnv } from "./env.schema.js";

describe("github discord notifier env", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates required GitHub notifier variables", () => {
    const env = createGitHubDiscordNotifierEnv({
      DISCORD_GITHUB_WEBHOOK_URL: "https://discord.com/api/webhooks/example",
      GITHUB_EVENT_NAME: "push",
      GITHUB_EVENT_PATH: "/tmp/event.json",
      GITHUB_REPOSITORY: "owner/repo",
      GITHUB_RUN_ID: "123",
      GITHUB_SHA: "abc123",
    });

    expect(env.DISCORD_GITHUB_WEBHOOK_URL).toBe(
      "https://discord.com/api/webhooks/example",
    );
    expect(env.GITHUB_SERVER_URL).toBe("https://github.com");
    expect(env.GITHUB_RUN_ID).toBe("123");
    expect(env.GITHUB_SHA).toBe("abc123");
  });

  it("accepts a custom GitHub server URL", () => {
    const env = createGitHubDiscordNotifierEnv({
      DISCORD_GITHUB_WEBHOOK_URL: "https://discord.com/api/webhooks/example",
      GITHUB_EVENT_NAME: "push",
      GITHUB_EVENT_PATH: "/tmp/event.json",
      GITHUB_REPOSITORY: "owner/repo",
      GITHUB_SERVER_URL: "https://github.example.com",
    });

    expect(env.GITHUB_SERVER_URL).toBe("https://github.example.com");
  });

  it("rejects missing required variables", () => {
    expect(() =>
      createGitHubDiscordNotifierEnv({
        DISCORD_GITHUB_WEBHOOK_URL: "https://discord.com/api/webhooks/example",
      }),
    ).toThrow("Invalid environment variables");
  });
});
