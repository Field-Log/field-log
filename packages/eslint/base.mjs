import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.turbo/**",
      "**/dist/**",
      "**/build/**",
      "**/.output/**",
      "**/.tanstack/**",
      "**/.expo/**",
      "**/coverage/**",
      "**/routeTree.gen.ts",
      "apps/autmog/images/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
];
