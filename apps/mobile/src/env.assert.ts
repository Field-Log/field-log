import { createMobileEnv } from "./env.schema";

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(
      `${message}: expected ${String(expected)}, got ${String(actual)}`,
    );
  }
}

function assertThrows(fn: () => unknown, message: string): void {
  try {
    fn();
  } catch {
    return;
  }

  throw new Error(`${message}: expected function to throw`);
}

const absentEnv = createMobileEnv({});
assertEqual(
  absentEnv.EXPO_PUBLIC_API_BASE_URL,
  undefined,
  "optional API base URL can be absent",
);
assertEqual(
  absentEnv.EXPO_PUBLIC_LOG_PROXY_URL,
  undefined,
  "optional log proxy URL can be absent",
);

const validEnv = createMobileEnv({
  EXPO_PUBLIC_API_BASE_URL: "https://api.example.com",
  EXPO_PUBLIC_FIREBASE_API_KEY: "firebase-api-key",
  EXPO_PUBLIC_FIREBASE_APP_ID: "firebase-app-id",
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: "field-log.example.com",
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456789",
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: "field-log",
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: "field-log.example.com",
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: "ios-client-id",
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: "web-client-id",
  EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY: "client-key",
  EXPO_PUBLIC_LOG_PROXY_URL: "https://api.example.com/api/v1/logs",
});
assertEqual(
  validEnv.EXPO_PUBLIC_API_BASE_URL,
  "https://api.example.com",
  "valid API base URL is preserved",
);
assertEqual(
  validEnv.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  "field-log",
  "valid Firebase project ID is preserved",
);
assertEqual(
  validEnv.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  "web-client-id",
  "valid Google web client ID is preserved",
);
assertEqual(
  validEnv.EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY,
  "client-key",
  "valid log proxy client key is preserved",
);
assertEqual(
  validEnv.EXPO_PUBLIC_LOG_PROXY_URL,
  "https://api.example.com/api/v1/logs",
  "valid log proxy URL is preserved",
);

assertThrows(
  () =>
    createMobileEnv({
      EXPO_PUBLIC_API_BASE_URL: "not a url",
    }),
  "malformed API base URL is rejected",
);
assertThrows(
  () =>
    createMobileEnv({
      EXPO_PUBLIC_LOG_PROXY_URL: "not a url",
    }),
  "malformed log proxy URL is rejected",
);
