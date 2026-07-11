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
  paths: readonly string[];
};

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
      paths: [mobileSecretPath],
    },
    "build:preview": {
      allowServerSecrets: false,
      environmentSlug: "preview",
      paths: [mobileSecretPath],
    },
    "build:prod": {
      allowServerSecrets: false,
      environmentSlug: "prod",
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
