import { serve } from "@hono/node-server";
import { loggerMessages } from "@package/logger";
import { createApp } from "./app.js";
import { apiEnv } from "./env.js";
import { createMobileVersionPolicyFromApiEnv } from "./env.schema.js";
import { s } from "./lib/services.js";

const app = createApp({
  clientLogKey: apiEnv.LOG_PROXY_CLIENT_KEY,
  getFeatureFlagsService: () => s.flags,
  mobileVersionPolicy: createMobileVersionPolicyFromApiEnv(apiEnv),
});

serve(
  {
    fetch: app.fetch,
    port: apiEnv.PORT,
  },
  (info) => {
    s.logger.info(loggerMessages.api.serverListening, {
      attributes: {
        port: info.port,
        url: `http://localhost:${info.port}`,
      },
    });
  },
);
