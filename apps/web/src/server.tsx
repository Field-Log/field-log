import type { Register } from "@tanstack/react-router";
import {
  createStartHandler,
  defaultStreamHandler,
  type RequestHandler,
} from "@tanstack/react-start/server";
import { serverEnv } from "@/env/server";
import { handleLogIngestionRequest } from "@/lib/log-ingestion";
import { s } from "@/lib/services";

const fetch = createStartHandler(defaultStreamHandler);

type ServerEntry = { fetch: RequestHandler<Register> };

function createServerEntry(entry: ServerEntry): ServerEntry {
  return {
    async fetch(...args) {
      const [request] = args;

      if (
        request.method === "POST" &&
        new URL(request.url).pathname === "/api/v0/logs"
      ) {
        return await handleLogIngestionRequest({
          clientLogKey: serverEnv.LOG_PROXY_CLIENT_KEY,
          logger: s.logger,
          request,
        });
      }

      return await entry.fetch(...args);
    },
  };
}

export default createServerEntry({ fetch });
