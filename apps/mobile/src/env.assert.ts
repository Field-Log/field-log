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

const originalConsoleError = console.error;
console.error = () => {};

try {
  const absentEnv = createMobileEnv({});
  assertEqual(
    absentEnv.EXPO_PUBLIC_API_BASE_URL,
    undefined,
    "optional API base URL can be absent",
  );

  const validEnv = createMobileEnv({
    EXPO_PUBLIC_API_BASE_URL: "https://api.example.com",
  });
  assertEqual(
    validEnv.EXPO_PUBLIC_API_BASE_URL,
    "https://api.example.com",
    "valid API base URL is preserved",
  );

  assertThrows(
    () =>
      createMobileEnv({
        EXPO_PUBLIC_API_BASE_URL: "not a url",
      }),
    "malformed API base URL is rejected",
  );
} finally {
  console.error = originalConsoleError;
}
