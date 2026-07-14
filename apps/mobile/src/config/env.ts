import { mobileEnv } from "../env";

type FieldLogEnvName =
  | "EXPO_PUBLIC_FIREBASE_API_KEY"
  | "EXPO_PUBLIC_FIREBASE_APP_ID"
  | "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"
  | "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
  | "EXPO_PUBLIC_FIREBASE_PROJECT_ID"
  | "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET";

function requiredEnv(name: FieldLogEnvName): string {
  const value = mobileEnv[name];

  if (!value) {
    throw new Error(`${name} must be provided by Infisical.`);
  }

  return value;
}

export const fieldLogEnv = {
  EXPO_PUBLIC_FIREBASE_API_KEY: requiredEnv("EXPO_PUBLIC_FIREBASE_API_KEY"),
  EXPO_PUBLIC_FIREBASE_APP_ID: requiredEnv("EXPO_PUBLIC_FIREBASE_APP_ID"),
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: requiredEnv(
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  ),
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: requiredEnv(
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  ),
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: requiredEnv(
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  ),
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: requiredEnv(
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  ),
} as const;
