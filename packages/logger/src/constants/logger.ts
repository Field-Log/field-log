export const loggerMessages = {
  api: {
    cronHourly: "api.cron.hourly",
    healthChecked: "api.health.checked",
    serverListening: "api.server.listening",
    workerUnhandledException: "api.worker.unhandledException",
  },
  ci: {
    database: {
      preview: {
        branchCleanupSkipped: "ci.database.preview.branchCleanup.skipped",
        branchCreated: "ci.database.preview.branch.created",
        branchDeleted: "ci.database.preview.branch.deleted",
        branchLimitReached: "ci.database.preview.branchLimit.reached",
        changeDetectionCompleted:
          "ci.database.preview.changeDetection.completed",
        migrationsApplied: "ci.database.preview.migrations.applied",
        noPrBranchNeeded: "ci.database.preview.noPrBranch.needed",
        prBranchRecreateRequested:
          "ci.database.preview.prBranchRecreate.requested",
        stagingDatabaseSelected: "ci.database.preview.stagingDatabase.selected",
      },
      production: {
        databaseSelected: "ci.database.production.database.selected",
        migrationsApplied: "ci.database.production.migrations.applied",
      },
      staging: {
        databaseSelected: "ci.database.staging.database.selected",
        migrationsApplied: "ci.database.staging.migrations.applied",
        reset: "ci.database.staging.reset",
      },
    },
    github: {
      dbChangeLabelSynced: "ci.github.dbChangeLabel.synced",
    },
    vercel: {
      preview: {
        databaseOverrideMissing: "ci.vercel.preview.databaseOverride.missing",
        databaseOverrideRemoved: "ci.vercel.preview.databaseOverride.removed",
        databaseOverrideSet: "ci.vercel.preview.databaseOverride.set",
        latestDeploymentResolved: "ci.vercel.preview.latestDeployment.resolved",
        latestDeploymentUnavailable:
          "ci.vercel.preview.latestDeployment.unavailable",
      },
    },
  },
  common: {},
  database: {
    featureFlags: {
      archive: "database.featureFlags.archive",
      create: "database.featureFlags.create",
      evaluate: "database.featureFlags.evaluate",
      listAdmin: "database.featureFlags.listAdmin",
      listAdminTargetingForUser:
        "database.featureFlags.listAdminTargetingForUser",
      listUserBeta: "database.featureFlags.listUserBeta",
      setAdminOverride: "database.featureFlags.setAdminOverride",
      setUserPreference: "database.featureFlags.setUserPreference",
      update: "database.featureFlags.update",
    },
    userSettings: {
      getByClerkId: "database.userSettings.getByClerkId",
      upsertForClerkId: "database.userSettings.upsertForClerkId",
    },
    users: {
      ensure: "database.users.ensure",
      getByClerkId: "database.users.getByClerkId",
    },
  },
  featureFlags: {
    evaluationFailedClosed: "featureFlags.evaluation.failedClosed",
  },
  mobile: {
    authSignInFailed: "mobile.auth.signIn.failed",
    databaseInitFailed: "mobile.database.init.failed",
    exportFailed: "mobile.export.failed",
    featureFlagsFetchFailed: "mobile.featureFlags.fetch.failed",
    screenViewed: "mobile.screen.viewed",
    syncUploadFailed: "mobile.sync.upload.failed",
    versionPolicyFetchFailed: "mobile.versionPolicy.fetch.failed",
    versionPolicyStoreOpenFailed: "mobile.versionPolicy.storeOpen.failed",
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
    ci: "ci",
    mobile: "expo",
    web: "web",
  },
  logProxy: {
    clientKeyHeader: "x-log-client-key",
    maxBatchSize: 25,
    source: "log-proxy",
  },
} as const;
