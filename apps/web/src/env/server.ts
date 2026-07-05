import process from "node:process";
import { createWebServerEnv } from "./server.schema";

export const serverEnv = createWebServerEnv({
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
});
