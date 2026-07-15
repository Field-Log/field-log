import {
  createAxiomTransport,
  createConsoleTransport,
  createLogger,
  type Logger,
  loggerValues,
  normalizeConsoleTransportMode,
  normalizeLogLevel,
} from "@package/logger";

export type ScraperLoggerConfig = {
  appEnv?: string;
  axiomDataset?: string;
  axiomEdgeDomain?: string;
  axiomToken?: string;
  loggerMode?: string;
  logLevel?: string;
};

export function createScraperLogger(config: ScraperLoggerConfig): Logger {
  const hasAxiomConfig = Boolean(config.axiomToken && config.axiomDataset);
  const environment = config.appEnv ?? "development";
  const isDevelopment = environment === "development";
  const consoleTransport = createConsoleTransport({
    mode: normalizeConsoleTransportMode(config.loggerMode),
  });
  const transports = [
    ...(hasAxiomConfig
      ? [
          createAxiomTransport({
            dataset: config.axiomDataset ?? "",
            edgeDomain: config.axiomEdgeDomain,
            token: config.axiomToken ?? "",
          }),
        ]
      : []),
    ...(isDevelopment || !hasAxiomConfig ? [consoleTransport] : []),
  ];

  return createLogger({
    app: loggerValues.apps.scraper,
    environment,
    level: normalizeLogLevel(config.logLevel),
    transports,
  });
}
