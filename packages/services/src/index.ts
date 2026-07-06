import type { DatabaseConfig } from "@repo/database";
import { createDb } from "@repo/database";
import { createLogger, type Logger, type LoggerConfig } from "@repo/logger";
import { createDbServices, type DbServices } from "./db/index.js";

export type ServicesConfig =
  | {
      db: DatabaseConfig;
      logger: LoggerConfig;
    }
  | {
      db?: undefined;
      logger?: LoggerConfig;
    };

export class Services {
  #db?: DbServices;
  #logger?: Logger;

  configure(config: ServicesConfig): void {
    if (config.db && !config.logger) {
      throw new Error("Database services require logger configuration.");
    }

    if (config.logger) {
      this.#logger = createLogger(config.logger);
    }

    if (config.db) {
      if (!this.#logger) {
        throw new Error("Database services require logger configuration.");
      }

      this.#db = createDbServices(createDb(config.db), this.#logger);
    }
  }

  get db(): DbServices {
    if (!this.#db) {
      throw new Error(
        "Database services have not been configured. Import the app-local services module and provide database configuration before using s.db.",
      );
    }

    return this.#db;
  }

  get logger(): Logger {
    if (!this.#logger) {
      throw new Error(
        "Logger service has not been configured. Import the app-local services module and provide logger configuration before using s.logger.",
      );
    }

    return this.#logger;
  }
}

export function createServices(): Services {
  return new Services();
}

const services = createServices();

export default services;
