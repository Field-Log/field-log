import baseConfig from "@package/eslint/base";

export default [
  ...baseConfig,
  {
    files: ["scripts/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
  },
];
