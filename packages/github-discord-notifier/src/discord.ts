import type { DiscordPayload } from "./format.js";

export class DiscordNotificationError extends Error {
  override name = "DiscordNotificationError";
}

export async function sendDiscordNotification(
  webhookUrl: string,
  payload: DiscordPayload,
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new DiscordNotificationError(
      `Discord webhook failed with ${response.status}: ${responseText}`,
    );
  }
}
