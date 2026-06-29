import baseConfig from "@repo/eslint/base";

export default [
  ...baseConfig,
  {
    files: ["vitest.config.ts"],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
  },
];
