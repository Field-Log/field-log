export const defaultEnvironmentSlug = "dev";

const apiSecretPath = "/apps/api";
const cloudflareToolsSecretPath = "/tools/cloudflare";
const mobileSecretPath = "/apps/mobile";
const webSecretPath = "/apps/web";
const githubDiscordNotifierSecretPath = "/tools/github-discord-notifier";
const loggerAxiomTestSecretPath = "/tools/logger-axiom-test";

export type CommandSecretConfig = {
  allowServerSecrets: boolean;
  environmentSlug?: string;
  envAliases?: readonly EnvironmentAlias[];
  paths: readonly string[];
};

export type EnvironmentAlias = {
  from: string;
  to: string;
};

const mobileSecretAliases = [
  {
    from: "CLERK_PUBLISHABLE_KEY",
    to: "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
  },
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
    build: {
      allowServerSecrets: false,
      envAliases: mobileSecretAliases,
      paths: [mobileSecretPath],
    },
    "build:preview": {
      allowServerSecrets: false,
      envAliases: mobileSecretAliases,
      environmentSlug: "preview",
      paths: [mobileSecretPath],
    },
    "build:prod": {
      allowServerSecrets: false,
      envAliases: mobileSecretAliases,
      environmentSlug: "prod",
      paths: [mobileSecretPath],
    },
    dev: {
      allowServerSecrets: false,
      envAliases: mobileSecretAliases,
      paths: [mobileSecretPath],
    },
    android: {
      allowServerSecrets: false,
      envAliases: mobileSecretAliases,
      paths: [mobileSecretPath],
    },
    ios: {
      allowServerSecrets: false,
      envAliases: mobileSecretAliases,
      paths: [mobileSecretPath],
    },
    test: {
      allowServerSecrets: false,
      envAliases: mobileSecretAliases,
      paths: [mobileSecretPath],
    },
    "test:watch": {
      allowServerSecrets: false,
      envAliases: mobileSecretAliases,
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
