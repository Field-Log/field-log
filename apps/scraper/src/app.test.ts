import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("scraper app", () => {
  it("returns a health response", async () => {
    const app = createApp();

    const response = await app.request("/health");

    await expect(response.json()).resolves.toEqual({
      app: "scraper",
      ok: true,
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("returns 404 for unknown routes", async () => {
    const app = createApp();

    const response = await app.request("/missing");

    expect(response.status).toBe(404);
  });
});
