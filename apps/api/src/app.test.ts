import { describe, expect, it } from "vitest";
import app from "./app.js";

describe("api", () => {
  it("returns health status", async () => {
    const response = await app.request("/health");

    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: "api",
    });
  });
});
