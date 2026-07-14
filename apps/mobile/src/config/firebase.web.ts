import type { FirebaseApp } from "firebase/app";
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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

const existingApp = getApps()[0];
const app: FirebaseApp = existingApp ?? initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);
