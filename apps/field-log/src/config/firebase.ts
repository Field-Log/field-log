import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
// @ts-expect-error React Native persistence is available at runtime.
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { fieldLogEnv } from "./env";

const firebaseConfig = {
  apiKey: fieldLogEnv.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: fieldLogEnv.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: fieldLogEnv.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: fieldLogEnv.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: fieldLogEnv.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: fieldLogEnv.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
