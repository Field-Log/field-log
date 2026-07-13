import { loggerMessages } from "@package/logger";
import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session/providers/google";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { fieldLogEnv } from "../config/env";
import { auth } from "../config/firebase";
import { logger } from "../lib/logger";
import { C } from "../theme/colors";

WebBrowser.maybeCompleteAuthSession();

const NONCE_CHARACTERS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._";

async function createNonce(length = 32): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(length);
  return Array.from(bytes)
    .map((byte) => NONCE_CHARACTERS[byte % NONCE_CHARACTERS.length])
    .join("");
}

export default function AuthScreen() {
  const [mode, setMode] = useState<"landing" | "email">("landing");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [, googleResponse, googlePrompt] = AuthSession.useAuthRequest({
    clientId: fieldLogEnv.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: fieldLogEnv.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  // Handle Google OAuth response
  React.useEffect(() => {
    if (googleResponse?.type === "success") {
      const { id_token } = googleResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);
      setLoading(true);
      signInWithCredential(auth, credential)
        .catch((error: unknown) => {
          logger.warn(loggerMessages.mobile.authSignInFailed, {
            attributes: { provider: "google" },
            error,
          });
          Alert.alert("Google sign-in failed", getErrorMessage(error));
        })
        .finally(() => setLoading(false));
    }
  }, [googleResponse]);

  const handleApple = async () => {
    try {
      setLoading(true);
      const rawNonce = await createNonce();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );
      const appleCredential = await AppleAuthentication.signInAsync({
        nonce: hashedNonce,
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const provider = new OAuthProvider("apple.com");
      const idToken = appleCredential.identityToken;
      if (!idToken) {
        throw new Error("Apple sign-in did not return an identity token.");
      }
      const credential = provider.credential({
        idToken,
        rawNonce,
      });
      await signInWithCredential(auth, credential);
    } catch (error: unknown) {
      if (!isErrorWithCode(error, "ERR_REQUEST_CANCELED")) {
        logger.warn(loggerMessages.mobile.authSignInFailed, {
          attributes: { provider: "apple" },
          error,
        });
        Alert.alert("Apple sign-in failed", getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error: unknown) {
      logger.warn(loggerMessages.mobile.authSignInFailed, {
        attributes: {
          mode: isSignUp ? "sign_up" : "sign_in",
          provider: "email",
        },
        error,
      });
      Alert.alert(
        isSignUp ? "Sign up failed" : "Sign in failed",
        getErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (mode === "email") {
    return (
      <KeyboardAvoidingView
        style={styles.centered}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.title}>
          {isSignUp ? "Create account" : "Sign in"}
        </Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          autoComplete={isSignUp ? "new-password" : "current-password"}
        />

        <Pressable style={styles.primaryButton} onPress={handleEmail}>
          <Text style={styles.primaryButtonText}>
            {isSignUp ? "Create account" : "Sign in"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setIsSignUp((v) => !v)}
          style={styles.linkRow}
        >
          <Text style={styles.link}>
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </Text>
        </Pressable>

        <Pressable onPress={() => setMode("landing")} style={styles.linkRow}>
          <Text style={styles.link}>← Back</Text>
        </Pressable>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.centered}>
      <Text style={styles.appName}>Field Log</Text>
      <Text style={styles.tagline}>Your EDC, organized.</Text>

      <View style={styles.buttonStack}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={10}
          style={styles.appleButton}
          onPress={handleApple}
        />

        <Pressable
          style={[styles.oauthButton, styles.googleButton]}
          onPress={() => googlePrompt()}
        >
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </Pressable>

        <Pressable
          style={[styles.oauthButton, styles.emailButton]}
          onPress={() => setMode("email")}
        >
          <Text style={styles.emailButtonText}>Continue with Email</Text>
        </Pressable>
      </View>
    </View>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isErrorWithCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: C.bg,
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: { fontSize: 16, color: C.textMuted, marginBottom: 52 },
  buttonStack: { width: "100%", gap: 12 },
  appleButton: { width: "100%", height: 50 },
  oauthButton: {
    width: "100%",
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  googleButton: {
    backgroundColor: C.bgCard,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  googleButtonText: { fontSize: 15, fontWeight: "600", color: C.text },
  emailButton: { backgroundColor: C.accent },
  emailButtonText: { fontSize: 15, fontWeight: "600", color: C.text },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 28,
    alignSelf: "flex-start",
    color: C.text,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: C.bgInput,
    color: C.text,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: { color: C.text, fontSize: 15, fontWeight: "700" },
  linkRow: { marginTop: 16 },
  link: { color: C.accentBright, fontSize: 14 },
});
