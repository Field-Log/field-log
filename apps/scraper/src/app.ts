import { Hono } from "hono";

export function createApp() {
  const app = new Hono();

  app.get("/health", (context) =>
    context.json({
      app: "scraper",
      ok: true,
    }),
  );

  return app;
}

const app = createApp();

export default app;
