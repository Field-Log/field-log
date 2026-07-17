import baseConfig from "@package/eslint/base";

export default [
  {
    ignores: [".wrangler/**"],
  },
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
