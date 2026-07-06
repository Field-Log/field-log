import { readFile } from "node:fs/promises";
import { sendDiscordNotification } from "./discord.js";
import { formatGitHubNotification } from "./format.js";

async function main(): Promise<number> {
  const webhookUrl = requiredEnv("DISCORD_GITHUB_WEBHOOK_URL");
  const eventName = requiredEnv("GITHUB_EVENT_NAME");
  const eventPath = requiredEnv("GITHUB_EVENT_PATH");
  const repository = requiredEnv("GITHUB_REPOSITORY");
  const serverUrl = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const event = JSON.parse(await readFile(eventPath, "utf8")) as unknown;
  const notification = formatGitHubNotification(
    {
      eventName,
      repository,
      runId: process.env.GITHUB_RUN_ID,
      serverUrl,
      sha: process.env.GITHUB_SHA,
    },
    event,
  );

  if (!notification) {
    console.log(`No Discord notification generated for ${eventName}.`);
    return 0;
  }

  await sendDiscordNotification(webhookUrl, notification.payload);
  console.log(`Sent Discord notification for ${eventName}.`);
  return 0;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

process.exitCode = await main();
