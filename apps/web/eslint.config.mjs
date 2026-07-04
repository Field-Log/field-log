import reactConfig from "@repo/eslint/react";

export default [
  ...reactConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-console": "error",
    },
  },
];
