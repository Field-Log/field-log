export const loggerMessages = {
  api: {
    cronHourly: "api.cron.hourly",
    healthChecked: "api.health.checked",
    serverListening: "api.server.listening",
  },
  common: {},
  database: {
    userSettings: {
      getByClerkId: "database.userSettings.getByClerkId",
      upsertForClerkId: "database.userSettings.upsertForClerkId",
    },
    users: {
      ensure: "database.users.ensure",
    },
  },
  mobile: {
    authSignInFailed: "mobile.auth.signIn.failed",
    databaseInitFailed: "mobile.database.init.failed",
    exportFailed: "mobile.export.failed",
    screenViewed: "mobile.screen.viewed",
    syncUploadFailed: "mobile.sync.upload.failed",
  },
  web: {
    accountLoaded: "web.account.loaded",
    fxRatesFetchFailed: "web.fxRates.fetch.failed",
    previewApiDerived: "web.previewApi.derived",
  },
} as const;

export const loggerValues = {
  apps: {
    api: "api",
    mobile: "expo",
    web: "web",
  },
  logProxy: {
    clientKeyHeader: "x-log-client-key",
    maxBatchSize: 25,
    source: "log-proxy",
  },
} as const;
