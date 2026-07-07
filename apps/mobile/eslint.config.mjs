import reactNativeConfig from "@package/eslint/react-native";

export default [
  ...reactNativeConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-console": "error",
    },
  },
];
