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
  deploymentId?: string;
  deploymentTarget?: string;
  loggerMode?: string;
  logLevel?: string;
  railwayEnvironmentName?: string;
};

export function createScraperLogger(config: ScraperLoggerConfig): Logger {
  const hasAxiomConfig = Boolean(config.axiomToken && config.axiomDataset);
  const environment = config.appEnv ?? "development";
  const deploymentTarget =
    config.deploymentTarget ??
    (config.railwayEnvironmentName ? "railway" : "local");
  const deploymentId =
    config.deploymentId ?? config.railwayEnvironmentName ?? environment;
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
    consoleTransport,
  ];

  return createLogger({
    app: loggerValues.apps.scraper,
    deploymentId,
    deploymentTarget,
    environment,
    level: normalizeLogLevel(config.logLevel),
    transports,
  });
}
