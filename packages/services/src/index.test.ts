import { describe, expect, it } from "vitest";
import { createServices } from "./index.js";

describe("services", () => {
  it("throws a clear error when database services are used before configuration", () => {
    const services = createServices();

    expect(() => services.db).toThrow(
      "Database services have not been configured",
    );
  });

  it("throws a clear error when logger is used before configuration", () => {
    const services = createServices();

    expect(() => services.logger).toThrow(
      "Logger service has not been configured",
    );
  });

  it("configures database and logger independently", () => {
    const services = createServices();

    services.configure({
      logger: {
        app: "api",
        environment: "test",
        transports: [],
      },
    });

    expect(services.logger).toBeDefined();
    expect(() => services.db).toThrow(
      "Database services have not been configured",
    );
  });
});
