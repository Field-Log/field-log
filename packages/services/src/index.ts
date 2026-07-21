import type { DatabaseConfig } from "@package/database";
import { createDb } from "@package/database";
import { createLogger, type Logger, type LoggerConfig } from "@package/logger";
import { createDbServices, type DbServices } from "./db/index.js";
import {
  createFeatureFlagsService,
  type FeatureFlagsService,
} from "./flags/index.js";

export type {
  AdminTargetingFeatureFlag,
  FeatureFlagListItem,
  FeatureFlagsService,
  UserBetaFeatureFlag,
} from "./flags/index.js";

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
  #flags?: FeatureFlagsService;
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

      const db = createDb(config.db);
      this.#db = createDbServices(db, this.#logger);
      this.#flags = createFeatureFlagsService(db, this.#db.users, this.#logger);
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

  get flags(): FeatureFlagsService {
    if (!this.#flags) {
      throw new Error(
        "Feature flag services have not been configured. Import the app-local services module and provide database configuration before using s.flags.",
      );
    }

    return this.#flags;
  }
}

export function createServices(): Services {
  return new Services();
}

const services = createServices();

export default services;
