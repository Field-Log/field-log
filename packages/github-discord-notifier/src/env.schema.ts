import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export type GitHubDiscordNotifierRuntimeEnv = {
  DISCORD_GITHUB_WEBHOOK_URL?: string;
  GITHUB_EVENT_NAME?: string;
  GITHUB_EVENT_PATH?: string;
  GITHUB_REPOSITORY?: string;
  GITHUB_RUN_ID?: string;
  GITHUB_SERVER_URL?: string;
  GITHUB_SHA?: string;
};

export function createGitHubDiscordNotifierEnv(
  runtimeEnv: GitHubDiscordNotifierRuntimeEnv,
) {
  return createEnv({
    emptyStringAsUndefined: true,
    isServer: true,
    runtimeEnvStrict: {
      DISCORD_GITHUB_WEBHOOK_URL: runtimeEnv.DISCORD_GITHUB_WEBHOOK_URL,
      GITHUB_EVENT_NAME: runtimeEnv.GITHUB_EVENT_NAME,
      GITHUB_EVENT_PATH: runtimeEnv.GITHUB_EVENT_PATH,
      GITHUB_REPOSITORY: runtimeEnv.GITHUB_REPOSITORY,
      GITHUB_RUN_ID: runtimeEnv.GITHUB_RUN_ID,
      GITHUB_SERVER_URL: runtimeEnv.GITHUB_SERVER_URL,
      GITHUB_SHA: runtimeEnv.GITHUB_SHA,
    },
    server: {
      DISCORD_GITHUB_WEBHOOK_URL: z.string().min(1).url(),
      GITHUB_EVENT_NAME: z.string().min(1),
      GITHUB_EVENT_PATH: z.string().min(1),
      GITHUB_REPOSITORY: z.string().min(1),
      GITHUB_RUN_ID: z.string().min(1).optional(),
      GITHUB_SERVER_URL: z.string().min(1).url().default("https://github.com"),
      GITHUB_SHA: z.string().min(1).optional(),
    },
  });
}
