export const localEnvironmentSlug = "dev";

export const commonSecretPath = "/common";
const loggingSecretPath = "/logging";
const axiomServerSecretPath = "/axiom/server";
const cloudflareToolsSecretPath = "/tools/cloudflare";

export type EnvironmentAlias = {
  from: string;
  to: string;
};

export type CommandSecretConfig = {
  allowServerSecrets: boolean;
  envAliases?: readonly EnvironmentAlias[];
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

// LOG_PROXY_* values belong to /logging only. Keep /logging before /axiom/*
// when both are used because Axiom paths can provide LOG_LEVEL, and nested
// Infisical CLI runs also read that variable.
export const commandSecrets = {
  api: {
    dev: {
      allowServerSecrets: true,
      paths: ["/apps/api"],
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
      paths: ["/clerk", "/clerk/server", "/neon/server"],
    },
    "test:watch": {
      allowServerSecrets: true,
      paths: ["/clerk", "/clerk/server", "/neon/server"],
    },
  },
  autmog: {
    dev: {
      allowServerSecrets: false,
      paths: ["/clerk"],
    },
    test: {
      allowServerSecrets: false,
      paths: ["/clerk"],
    },
    "test:watch": {
      allowServerSecrets: false,
      paths: ["/clerk"],
    },
  },
  database: {
    "db:migrate": {
      allowServerSecrets: true,
      paths: ["/neon/server"],
    },
  },
  github: {
    "discord-notify": {
      allowServerSecrets: true,
      paths: ["/github/discord"],
    },
  },
  "field-log": {
    start: {
      allowServerSecrets: false,
      envAliases: expoLoggingAliases,
      paths: ["/clerk", loggingSecretPath],
    },
    dev: {
      allowServerSecrets: false,
      envAliases: expoLoggingAliases,
      paths: ["/clerk", loggingSecretPath],
    },
    android: {
      allowServerSecrets: false,
      envAliases: expoLoggingAliases,
      paths: ["/clerk", loggingSecretPath],
    },
    ios: {
      allowServerSecrets: false,
      envAliases: expoLoggingAliases,
      paths: ["/clerk", loggingSecretPath],
    },
    web: {
      allowServerSecrets: false,
      envAliases: expoLoggingAliases,
      paths: ["/clerk", loggingSecretPath],
    },
  },
  logger: {
    "test:axiom": {
      allowServerSecrets: true,
      paths: [loggingSecretPath, "/axiom/automated-tests"],
    },
  },
  mobile: {
    dev: {
      allowServerSecrets: false,
      envAliases: expoLoggingAliases,
      paths: ["/clerk", loggingSecretPath],
    },
    android: {
      allowServerSecrets: false,
      envAliases: expoLoggingAliases,
      paths: ["/clerk", loggingSecretPath],
    },
    ios: {
      allowServerSecrets: false,
      envAliases: expoLoggingAliases,
      paths: ["/clerk", loggingSecretPath],
    },
    test: {
      allowServerSecrets: false,
      paths: ["/clerk"],
    },
    "test:watch": {
      allowServerSecrets: false,
      paths: ["/clerk"],
    },
  },
  web: {
    build: {
      allowServerSecrets: true,
      envAliases: [...viteClerkAliases, ...viteLoggingAliases],
      paths: [
        "/clerk",
        "/clerk/server",
        "/neon/server",
        loggingSecretPath,
        axiomServerSecretPath,
      ],
    },
    dev: {
      allowServerSecrets: true,
      envAliases: [...viteClerkAliases, ...viteLoggingAliases],
      paths: [
        "/clerk",
        "/clerk/server",
        "/neon/server",
        loggingSecretPath,
        axiomServerSecretPath,
      ],
    },
    test: {
      allowServerSecrets: true,
      envAliases: viteClerkAliases,
      paths: ["/clerk", "/clerk/server", "/neon/server"],
    },
    "test:watch": {
      allowServerSecrets: true,
      envAliases: viteClerkAliases,
      paths: ["/clerk", "/clerk/server", "/neon/server"],
    },
  },
} as const satisfies Record<string, Record<string, CommandSecretConfig>>;
