export type FieldLogRuntimeEnv = {
  EXPO_PUBLIC_FIREBASE_API_KEY?: string;
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  EXPO_PUBLIC_FIREBASE_PROJECT_ID?: string;
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  EXPO_PUBLIC_FIREBASE_APP_ID?: string;
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
};

declare const process: {
  env: FieldLogRuntimeEnv;
};

function requiredEnv(name: keyof FieldLogRuntimeEnv): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} must be provided by Infisical.`);
  }

  return value;
}

export const fieldLogEnv = {
  EXPO_PUBLIC_FIREBASE_API_KEY: requiredEnv("EXPO_PUBLIC_FIREBASE_API_KEY"),
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: requiredEnv(
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  ),
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: requiredEnv(
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  ),
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: requiredEnv(
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  ),
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: requiredEnv(
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  ),
  EXPO_PUBLIC_FIREBASE_APP_ID: requiredEnv("EXPO_PUBLIC_FIREBASE_APP_ID"),
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: requiredEnv(
    "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID",
  ),
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: requiredEnv(
    "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID",
  ),
} as const;
