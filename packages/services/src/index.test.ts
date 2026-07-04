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

  it("configures logger independently", () => {
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

  it("rejects database configuration without logger configuration", () => {
    const services = createServices();

    expect(() =>
      services.configure({
        db: {
          databaseUrl: "postgres://user:pass@example.test:5432/db",
        },
      } as Parameters<typeof services.configure>[0]),
    ).toThrow("Database services require logger configuration");
  });

  it("configures database when logger configuration is provided", () => {
    const services = createServices();

    services.configure({
      db: {
        databaseUrl: "postgres://user:pass@example.test:5432/db",
      },
      logger: {
        app: "api",
        environment: "test",
        transports: [],
      },
    });

    expect(services.db).toBeDefined();
    expect(services.logger).toBeDefined();
  });
});
