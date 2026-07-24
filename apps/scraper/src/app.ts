import { type Logger, loggerMessages } from "@package/logger";
import { Hono } from "hono";

export type CreateAppOptions = {
  logger?: Logger;
};

export function createApp(options: CreateAppOptions = {}) {
  const app = new Hono();

  app.get("/health", (context) => {
    options.logger?.info(loggerMessages.scraper.healthChecked, {
      attributes: {
        route: "/health",
      },
    });

    return context.json({
      app: "scraper",
      ok: true,
    });
  });

  return app;
}

const app = createApp();

export default app;
