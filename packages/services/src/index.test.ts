import { describe, expect, it } from "vitest";
import { createServices } from "./index.js";

describe("services", () => {
  it("throws a clear error when used before configuration", () => {
    const services = createServices();

    expect(() => services.db).toThrow("Services have not been configured");
  });
});
