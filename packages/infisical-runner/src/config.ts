export const localEnvironmentSlug = "dev";

export const commonSecretPath = "/common";

export type CommandSecretConfig = {
  client: boolean;
  paths: readonly string[];
};

export const commandSecrets = {
  api: {
    dev: {
      client: false,
      paths: ["/clerk", "/clerk/server"],
    },
    test: {
      client: false,
      paths: ["/clerk", "/clerk/server"],
    },
    "test:watch": {
      client: false,
      paths: ["/clerk", "/clerk/server"],
    },
  },
  autmog: {
    dev: {
      client: true,
      paths: ["/clerk"],
    },
    test: {
      client: true,
      paths: ["/clerk"],
    },
    "test:watch": {
      client: true,
      paths: ["/clerk"],
    },
  },
  "field-log": {
    start: {
      client: true,
      paths: ["/clerk"],
    },
    dev: {
      client: true,
      paths: ["/clerk"],
    },
    android: {
      client: true,
      paths: ["/clerk"],
    },
    ios: {
      client: true,
      paths: ["/clerk"],
    },
    web: {
      client: true,
      paths: ["/clerk"],
    },
  },
  mobile: {
    dev: {
      client: true,
      paths: ["/clerk"],
    },
    android: {
      client: true,
      paths: ["/clerk"],
    },
    ios: {
      client: true,
      paths: ["/clerk"],
    },
    test: {
      client: true,
      paths: ["/clerk"],
    },
    "test:watch": {
      client: true,
      paths: ["/clerk"],
    },
  },
  web: {
    dev: {
      client: true,
      paths: ["/clerk"],
    },
    test: {
      client: true,
      paths: ["/clerk"],
    },
    "test:watch": {
      client: true,
      paths: ["/clerk"],
    },
  },
} as const satisfies Record<string, Record<string, CommandSecretConfig>>;
