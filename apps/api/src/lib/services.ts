import services from "@repo/services";
import { apiEnv } from "../env.js";

services.configure({
  db: {
    databaseUrl: apiEnv.DATABASE_URL,
  },
});

export { services as s };
