import baseConfig from "@package/eslint/base";

export default [
  ...baseConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-console": "error",
    },
  },
  {
    files: ["vitest.config.ts"],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
  },
];
