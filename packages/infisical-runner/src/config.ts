export const defaultEnvironmentSlug = "dev";

const apiSecretPath = "/apps/api";
const cloudflareToolsSecretPath = "/tools/cloudflare";
const fastlaneToolsSecretPath = "/tools/fastlane";
const mobileSecretPath = "/apps/mobile";
const scraperSecretPath = "/apps/scraper";
const webSecretPath = "/apps/web";
const githubDiscordNotifierSecretPath = "/tools/github-discord-notifier";
const loggerAxiomTestSecretPath = "/tools/logger-axiom-test";
export const databaseUrlUserOverrideSecretPath = "/local/database";

export type CommandSecretConfig = {
  allowServerSecrets: boolean;
  databaseUrlUserOverride?: boolean;
  envAliases?: readonly EnvironmentAlias[];
  environmentSlug?: string;
  paths: readonly string[];
};

export type EnvironmentAlias = {
  from: string;
  to: string;
};

const expoClerkAliases = [
  {
    from: "CLERK_PUBLISHABLE_KEY",
    to: "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
  },
] as const satisfies readonly EnvironmentAlias[];

const expoLoggingAliases = [
  {
    from: "API_URL",
    to: "EXPO_PUBLIC_API_URL",
  },
  {
    from: "LOG_PROXY_CLIENT_KEY",
    to: "EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY",
  },
] as const satisfies readonly EnvironmentAlias[];

const expoFieldLogAliases = [
  {
    from: "FIREBASE_API_KEY",
    to: "EXPO_PUBLIC_FIREBASE_API_KEY",
  },
  {
    from: "FIREBASE_APP_ID",
    to: "EXPO_PUBLIC_FIREBASE_APP_ID",
  },
  {
    from: "FIREBASE_AUTH_DOMAIN",
    to: "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  },
  {
    from: "FIREBASE_MESSAGING_SENDER_ID",
    to: "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  },
  {
    from: "FIREBASE_PROJECT_ID",
    to: "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  },
  {
    from: "FIREBASE_STORAGE_BUCKET",
    to: "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  },
  {
    from: "GOOGLE_IOS_CLIENT_ID",
    to: "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID",
  },
  {
    from: "GOOGLE_WEB_CLIENT_ID",
    to: "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID",
  },
] as const satisfies readonly EnvironmentAlias[];

const fieldLogExpoAliases = [
  ...expoFieldLogAliases,
  ...expoClerkAliases,
  ...expoLoggingAliases,
] as const satisfies readonly EnvironmentAlias[];

export const commandSecrets = {
  api: {
    dev: {
      allowServerSecrets: true,
      databaseUrlUserOverride: true,
      paths: [apiSecretPath],
    },
    deploy: {
      allowServerSecrets: true,
      paths: [cloudflareToolsSecretPath],
    },
    "deploy:preview": {
      allowServerSecrets: true,
      paths: [cloudflareToolsSecretPath],
    },
    "deploy:staging": {
      allowServerSecrets: true,
      paths: [cloudflareToolsSecretPath],
    },
    test: {
      allowServerSecrets: true,
      databaseUrlUserOverride: true,
      paths: [apiSecretPath],
    },
    "test:watch": {
      allowServerSecrets: true,
      databaseUrlUserOverride: true,
      paths: [apiSecretPath],
    },
  },
  database: {
    "db:migrate": {
      allowServerSecrets: true,
      databaseUrlUserOverride: true,
      paths: [apiSecretPath],
    },
    "db:studio": {
      allowServerSecrets: true,
      databaseUrlUserOverride: true,
      paths: [apiSecretPath],
    },
  },
  github: {
    "discord-notify": {
      allowServerSecrets: true,
      paths: [githubDiscordNotifierSecretPath],
    },
  },
  "field-log": {
    start: {
      allowServerSecrets: false,
      envAliases: fieldLogExpoAliases,
      paths: [mobileSecretPath],
    },
    dev: {
      allowServerSecrets: false,
      envAliases: fieldLogExpoAliases,
      paths: [mobileSecretPath],
    },
    android: {
      allowServerSecrets: false,
      envAliases: fieldLogExpoAliases,
      paths: [mobileSecretPath],
    },
    ios: {
      allowServerSecrets: false,
      envAliases: fieldLogExpoAliases,
      paths: [mobileSecretPath],
    },
    web: {
      allowServerSecrets: false,
      envAliases: fieldLogExpoAliases,
      paths: [mobileSecretPath],
    },
  },
  logger: {
    "test:axiom": {
      allowServerSecrets: true,
      paths: [loggerAxiomTestSecretPath],
    },
  },
  mobile: {
    start: {
      allowServerSecrets: false,
      envAliases: fieldLogExpoAliases,
      paths: [mobileSecretPath],
    },
    build: {
      allowServerSecrets: false,
      envAliases: fieldLogExpoAliases,
      paths: [mobileSecretPath],
    },
    "build:preview": {
      allowServerSecrets: false,
      envAliases: fieldLogExpoAliases,
      environmentSlug: "preview",
      paths: [mobileSecretPath],
    },
    "build:prod": {
      allowServerSecrets: false,
      envAliases: fieldLogExpoAliases,
      environmentSlug: "prod",
      paths: [mobileSecretPath],
    },
    "fastlane:build:preview": {
      allowServerSecrets: true,
      envAliases: fieldLogExpoAliases,
      environmentSlug: "preview",
      paths: [fastlaneToolsSecretPath, mobileSecretPath],
    },
    "fastlane:build:prod": {
      allowServerSecrets: true,
      envAliases: fieldLogExpoAliases,
      environmentSlug: "prod",
      paths: [fastlaneToolsSecretPath, mobileSecretPath],
    },
    "fastlane:submit:prod": {
      allowServerSecrets: true,
      environmentSlug: "prod",
      paths: [fastlaneToolsSecretPath],
    },
    "fastlane:release:prod": {
      allowServerSecrets: true,
      envAliases: fieldLogExpoAliases,
      environmentSlug: "prod",
      paths: [fastlaneToolsSecretPath, mobileSecretPath],
    },
    dev: {
      allowServerSecrets: false,
      envAliases: fieldLogExpoAliases,
      paths: [mobileSecretPath],
    },
    android: {
      allowServerSecrets: false,
      envAliases: fieldLogExpoAliases,
      paths: [mobileSecretPath],
    },
    ios: {
      allowServerSecrets: false,
      envAliases: fieldLogExpoAliases,
      paths: [mobileSecretPath],
    },
    web: {
      allowServerSecrets: false,
      envAliases: fieldLogExpoAliases,
      paths: [mobileSecretPath],
    },
    test: {
      allowServerSecrets: false,
      envAliases: fieldLogExpoAliases,
      paths: [mobileSecretPath],
    },
    "test:watch": {
      allowServerSecrets: false,
      envAliases: fieldLogExpoAliases,
      paths: [mobileSecretPath],
    },
  },
  scraper: {
    "process:dead-letter": {
      allowServerSecrets: true,
      databaseUrlUserOverride: true,
      paths: [scraperSecretPath],
    },
    "process:queue": {
      allowServerSecrets: true,
      databaseUrlUserOverride: true,
      paths: [scraperSecretPath],
    },
    scrape: {
      allowServerSecrets: true,
      databaseUrlUserOverride: true,
      paths: [scraperSecretPath],
    },
    "scrape:autmog": {
      allowServerSecrets: true,
      databaseUrlUserOverride: true,
      paths: [scraperSecretPath],
    },
  },
  web: {
    build: {
      allowServerSecrets: true,
      databaseUrlUserOverride: true,
      paths: [webSecretPath],
    },
    dev: {
      allowServerSecrets: true,
      databaseUrlUserOverride: true,
      paths: [webSecretPath],
    },
    test: {
      allowServerSecrets: true,
      databaseUrlUserOverride: true,
      paths: [webSecretPath],
    },
    "test:watch": {
      allowServerSecrets: true,
      databaseUrlUserOverride: true,
      paths: [webSecretPath],
    },
  },
} as const satisfies Record<string, Record<string, CommandSecretConfig>>;
