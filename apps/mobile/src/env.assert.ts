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

assertThrows(() => createMobileEnv({}), "Clerk publishable key is required");

const validEnv = createMobileEnv({
  EXPO_PUBLIC_API_URL: "https://api.example.com",
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
  EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY: "client-key",
});
assertEqual(
  validEnv.EXPO_PUBLIC_API_URL,
  "https://api.example.com",
  "valid API URL is preserved",
);
assertEqual(
  validEnv.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  "pk_test_example",
  "valid Clerk publishable key is preserved",
);
assertEqual(
  validEnv.EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY,
  "client-key",
  "valid log proxy client key is preserved",
);

const localEnv = createMobileEnv({
  EXPO_PUBLIC_API_URL: "localhost:4006",
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
});
assertEqual(
  localEnv.EXPO_PUBLIC_API_URL,
  "http://localhost:4006",
  "bare localhost API URL is normalized",
);

assertThrows(
  () =>
    createMobileEnv({
      EXPO_PUBLIC_API_URL: "not a url",
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
    }),
  "malformed API URL is rejected",
);
