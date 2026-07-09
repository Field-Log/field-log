export const localEnvironmentSlug = "dev";

const apiSecretPath = "/apps/api";
const cloudflareToolsSecretPath = "/tools/cloudflare";
const mobileSecretPath = "/apps/mobile";
const webSecretPath = "/apps/web";
const githubDiscordNotifierSecretPath = "/tools/github-discord-notifier";
const loggerAxiomTestSecretPath = "/tools/logger-axiom-test";

export type CommandSecretConfig = {
  allowServerSecrets: boolean;
  envAliases?: readonly EnvironmentAlias[];
  paths: readonly string[];
};

export type EnvironmentAlias = {
  from: string;
  to: string;
};

const expoLoggingAliases = [
  {
    from: "LOG_PROXY_URL",
    to: "EXPO_PUBLIC_LOG_PROXY_URL",
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
  ...expoLoggingAliases,
] as const satisfies readonly EnvironmentAlias[];

export const commandSecrets = {
  api: {
    dev: {
      allowServerSecrets: true,
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
      paths: [apiSecretPath],
    },
    "test:watch": {
      allowServerSecrets: true,
      paths: [apiSecretPath],
    },
  },
  database: {
    "db:migrate": {
      allowServerSecrets: true,
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
  web: {
    build: {
      allowServerSecrets: true,
      paths: [webSecretPath],
    },
    dev: {
      allowServerSecrets: true,
      paths: [webSecretPath],
    },
    test: {
      allowServerSecrets: true,
      paths: [webSecretPath],
    },
    "test:watch": {
      allowServerSecrets: true,
      paths: [webSecretPath],
    },
  },
} as const satisfies Record<string, Record<string, CommandSecretConfig>>;
