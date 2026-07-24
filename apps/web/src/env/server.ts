import process from "node:process";
import { createWebServerEnv } from "./server.schema";

export const serverEnv = createWebServerEnv({
  AXIOM_DATASET: process.env.AXIOM_DATASET,
  AXIOM_EDGE_DOMAIN: process.env.AXIOM_EDGE_DOMAIN,
  AXIOM_TOKEN: process.env.AXIOM_TOKEN,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  IMAGE_KIT_FOLDER_PREFIX: process.env.IMAGE_KIT_FOLDER_PREFIX,
  LOGGER: process.env.LOGGER,
  LOG_LEVEL: process.env.LOG_LEVEL,
});
