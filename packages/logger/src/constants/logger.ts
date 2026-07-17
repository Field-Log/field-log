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
        prBranchReused: "ci.database.preview.prBranch.reused",
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
    userSettings: {
      getByClerkId: "database.userSettings.getByClerkId",
      upsertForClerkId: "database.userSettings.upsertForClerkId",
    },
    users: {
      ensure: "database.users.ensure",
    },
  },
  images: {
    delete: "images.delete",
    update: "images.update",
    upload: "images.upload",
  },
  mobile: {
    authSignInFailed: "mobile.auth.signIn.failed",
    databaseInitFailed: "mobile.database.init.failed",
    exportFailed: "mobile.export.failed",
    screenViewed: "mobile.screen.viewed",
    syncUploadFailed: "mobile.sync.upload.failed",
    versionPolicyFetchFailed: "mobile.versionPolicy.fetch.failed",
    versionPolicyStoreOpenFailed: "mobile.versionPolicy.storeOpen.failed",
  },
  scraper: {
    autmog: {
      fetchCompleted: "scraper.autmog.fetch.completed",
      fetchFailed: "scraper.autmog.fetch.failed",
      producerCompleted: "scraper.autmog.producer.completed",
      producerStarted: "scraper.autmog.producer.started",
    },
    cron: {
      completed: "scraper.cron.completed",
      failed: "scraper.cron.failed",
      started: "scraper.cron.started",
      taskCompleted: "scraper.cron.task.completed",
      taskFailed: "scraper.cron.task.failed",
      taskSkipped: "scraper.cron.task.skipped",
      taskStarted: "scraper.cron.task.started",
    },
    database: {
      archiveCompleted: "scraper.database.archive.completed",
      mutationCompleted: "scraper.database.mutation.completed",
      mutationFailed: "scraper.database.mutation.failed",
    },
    image: {
      deleteCompleted: "scraper.image.delete.completed",
      deleteFailed: "scraper.image.delete.failed",
      deleteSkipped: "scraper.image.delete.skipped",
      uploadCompleted: "scraper.image.upload.completed",
      uploadFailed: "scraper.image.upload.failed",
      uploadSkipped: "scraper.image.upload.skipped",
    },
    healthChecked: "scraper.health.checked",
    processor: {
      completed: "scraper.processor.completed",
      errorSummary: "scraper.processor.errors.summary",
      failed: "scraper.processor.failed",
      imageJobCompleted: "scraper.processor.imageJob.completed",
      imageJobFailed: "scraper.processor.imageJob.failed",
      itemJobCompleted: "scraper.processor.itemJob.completed",
      itemJobFailed: "scraper.processor.itemJob.failed",
      started: "scraper.processor.started",
    },
    queue: {
      deadLetterCompleted: "scraper.queue.deadLetter.completed",
      deadLetterFailed: "scraper.queue.deadLetter.failed",
      deadLetterStarted: "scraper.queue.deadLetter.started",
      drainCompleted: "scraper.queue.drain.completed",
      drainFailed: "scraper.queue.drain.failed",
      enqueueCompleted: "scraper.queue.enqueue.completed",
      enqueueFailed: "scraper.queue.enqueue.failed",
    },
    run: {
      completed: "scraper.run.completed",
      failed: "scraper.run.failed",
      started: "scraper.run.started",
    },
    scheduler: {
      lockSkipped: "scraper.scheduler.lock.skipped",
      started: "scraper.scheduler.started",
      stopped: "scraper.scheduler.stopped",
      taskCompleted: "scraper.scheduler.task.completed",
      taskFailed: "scraper.scheduler.task.failed",
      taskStarted: "scraper.scheduler.task.started",
    },
    serverFailed: "scraper.server.failed",
    serverListening: "scraper.server.listening",
    serverStopping: "scraper.server.stopping",
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
    scraper: "scraper",
    web: "web",
  },
  logProxy: {
    clientKeyHeader: "x-log-client-key",
    maxBatchSize: 25,
    source: "log-proxy",
  },
} as const;
