export const nonProductionSourceScrapeLimit = 30;

export function getSourceScrapeLimit(appEnv: string | undefined) {
  return appEnv === "production" ? undefined : nonProductionSourceScrapeLimit;
}
