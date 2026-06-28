import { initializeApp, getApps } from "firebase/app";
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAVZNV_cv9PsuRI-1aw2oYqLLiK8GxyET8",
  authDomain: "field-log-fc96c.firebaseapp.com",
  projectId: "field-log-fc96c",
  storageBucket: "field-log-fc96c.firebasestorage.app",
  messagingSenderId: "987730931157",
  appId: "1:987730931157:web:858c21b63cd2a300d1615c",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
