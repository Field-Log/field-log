import reactNativeConfig from "@package/eslint/react-native";

export default [
  ...reactNativeConfig,
  {
    files: ["metro.config.js"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];
