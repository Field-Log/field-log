export const localEnvironmentSlug = "dev";

const apiSecretPath = "/apps/api";
const autmogSecretPath = "/apps/autmog";
const mobileSecretPath = "/apps/mobile";
const webSecretPath = "/apps/web";
const githubDiscordNotifierSecretPath = "/tools/github-discord-notifier";
const loggerAxiomTestSecretPath = "/tools/logger-axiom-test";

export type CommandSecretConfig = {
  allowServerSecrets: boolean;
  paths: readonly string[];
};

const viteClerkAliases = [
  {
    from: "CLERK_PUBLISHABLE_KEY",
    to: "VITE_CLERK_PUBLISHABLE_KEY",
  },
  {
    from: "CLERK_SIGN_IN_URL",
    to: "VITE_CLERK_SIGN_IN_URL",
  },
  {
    from: "CLERK_SIGN_UP_URL",
    to: "VITE_CLERK_SIGN_UP_URL",
  },
] as const satisfies readonly EnvironmentAlias[];

const viteLoggingAliases = [
  {
    from: "LOG_PROXY_URL",
    to: "VITE_LOG_PROXY_URL",
  },
  {
    from: "LOG_PROXY_CLIENT_KEY",
    to: "VITE_LOG_PROXY_CLIENT_KEY",
  },
] as const satisfies readonly EnvironmentAlias[];

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

// LOG_PROXY_* values belong to /logging only. Keep /logging before /axiom/*
// when both are used because Axiom paths can provide LOG_LEVEL, and nested
// Infisical CLI runs also read that variable.
export const commandSecrets = {
  api: {
    dev: {
      allowServerSecrets: true,
      paths: [apiSecretPath],
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
  autmog: {
    dev: {
      allowServerSecrets: false,
      paths: [autmogSecretPath],
    },
    test: {
      allowServerSecrets: false,
      paths: [autmogSecretPath],
    },
    "test:watch": {
      allowServerSecrets: false,
      paths: [autmogSecretPath],
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
      paths: [mobileSecretPath],
    },
    dev: {
      allowServerSecrets: false,
      paths: [mobileSecretPath],
    },
    android: {
      allowServerSecrets: false,
      paths: [mobileSecretPath],
    },
    ios: {
      allowServerSecrets: false,
      paths: [mobileSecretPath],
    },
    web: {
      allowServerSecrets: false,
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
      paths: ["/clerk", mobileAppSecretPath, loggingSecretPath],
    },
    dev: {
      allowServerSecrets: false,
      paths: [mobileSecretPath],
    },
    android: {
      allowServerSecrets: false,
      paths: [mobileSecretPath],
    },
    ios: {
      allowServerSecrets: false,
      paths: [mobileSecretPath],
    },
    test: {
      allowServerSecrets: false,
      paths: [mobileSecretPath],
    },
    "test:watch": {
      allowServerSecrets: false,
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
