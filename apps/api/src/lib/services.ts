import services from "@repo/services";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to configure services.");
}

services.configure({
  db: {
    databaseUrl,
  },
});

export { services as s };
