import baseConfig from "@package/eslint/base";

export default [
  {
    ignores: ["drizzle.config.ts", "drizzle/**"],
  },
  ...baseConfig,
];
