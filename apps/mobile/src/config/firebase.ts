import type { FirebaseApp } from "firebase/app";
import { getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebasePublicEnv } from "./env";

const firebaseConfig = {
  apiKey: firebasePublicEnv.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: firebasePublicEnv.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: firebasePublicEnv.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: firebasePublicEnv.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebasePublicEnv.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebasePublicEnv.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const existingApp = getApps()[0];
const app: FirebaseApp = existingApp ?? initializeApp(firebaseConfig);

export const db = getFirestore(app);
