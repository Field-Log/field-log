export const localEnvironmentSlug = "dev";

export const commonSecretPath = "/common";

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

export const commandSecrets = {
  api: {
    dev: {
      allowServerSecrets: true,
      paths: ["/clerk", "/clerk/server", "/neon/server"],
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
  "field-log": {
    start: {
      allowServerSecrets: false,
      paths: ["/clerk"],
    },
    dev: {
      allowServerSecrets: false,
      paths: ["/clerk"],
    },
    android: {
      allowServerSecrets: false,
      paths: ["/clerk"],
    },
    ios: {
      allowServerSecrets: false,
      paths: ["/clerk"],
    },
    web: {
      allowServerSecrets: false,
      paths: ["/clerk"],
    },
  },
  mobile: {
    dev: {
      allowServerSecrets: false,
      paths: ["/clerk"],
    },
    android: {
      allowServerSecrets: false,
      paths: ["/clerk"],
    },
    ios: {
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
  web: {
    build: {
      allowServerSecrets: true,
      envAliases: viteClerkAliases,
      paths: ["/clerk", "/clerk/server", "/neon/server"],
    },
    dev: {
      allowServerSecrets: true,
      envAliases: viteClerkAliases,
      paths: ["/clerk", "/clerk/server", "/neon/server"],
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
