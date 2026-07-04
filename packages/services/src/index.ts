import type { DatabaseConfig } from "@repo/database";
import { createDb } from "@repo/database";
import { createDbServices, type DbServices } from "./db/index.js";

export type ServicesConfig = {
  db: DatabaseConfig;
};

export class Services {
  #db?: DbServices;

  configure(config: ServicesConfig): void {
    this.#db = createDbServices(createDb(config.db));
  }

  get db(): DbServices {
    if (!this.#db) {
      throw new Error(
        "Services have not been configured. Import the app-local services module before using services.",
      );
    }

    return this.#db;
  }
}

export function createServices(): Services {
  return new Services();
}

const services = createServices();

export default services;
