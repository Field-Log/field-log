import services from "@repo/services";
import { serverEnv } from "@/env/server";

services.configure({
  db: {
    databaseUrl: serverEnv.DATABASE_URL,
  },
});

export { services as s };
