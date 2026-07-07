import reactConfig from "@package/eslint/react";

export default [
  ...reactConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-console": "error",
    },
  },
];
