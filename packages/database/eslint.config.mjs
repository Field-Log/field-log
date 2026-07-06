import baseConfig from "@repo/eslint/base";

export default [
  {
    ignores: ["drizzle.config.ts", "drizzle/**"],
  },
  ...baseConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-console": "error",
    },
  },
];
