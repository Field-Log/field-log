import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/index.js";

export type DatabaseConfig = {
  databaseUrl: string;
};

export function createDb({ databaseUrl }: DatabaseConfig) {
  if (!databaseUrl) {
    throw new Error("Database configuration requires databaseUrl.");
  }

  const client = neon(databaseUrl);

  return drizzle({
    client,
    schema,
  });
}

export type Database = ReturnType<typeof createDb>;
