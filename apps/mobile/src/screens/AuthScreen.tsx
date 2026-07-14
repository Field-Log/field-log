import { useSignIn, useSignUp, useSSO } from "@clerk/expo";
import { loggerMessages } from "@package/logger";
import * as WebBrowser from "expo-web-browser";
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
import { logger } from "../lib/logger";
import { C } from "../theme/colors";

WebBrowser.maybeCompleteAuthSession();

type AuthMode = "sign-in" | "sign-up";

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();
  const { startSSOFlow } = useSSO();

  const isSignUp = mode === "sign-up";

  const handleGoogle = async () => {
    try {
      setLoading(true);
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
      });

      if (createdSessionId) {
        await setActive?.({ session: createdSessionId });
      }
    } catch (error: unknown) {
      logger.warn(loggerMessages.mobile.authSignInFailed, {
        attributes: { provider: "google" },
        error,
      });
      Alert.alert("Google sign-in failed", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    const emailAddress = email.trim();
    if (!emailAddress || !password) return;

    setLoading(true);
    try {
      if (isSignUp) {
        const result = await signUp?.create({
          emailAddress,
          password,
        });

        if (result?.status === "complete") {
          await setSignUpActive?.({ session: result.createdSessionId });
          return;
        }

        await signUp?.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setPendingVerification(true);
        return;
      }

      const result = await signIn?.create({
        identifier: emailAddress,
        password,
      });

      if (result?.status === "complete") {
        await setSignInActive?.({ session: result.createdSessionId });
        return;
      }

      Alert.alert("Sign in needs another step", "Use Google or email code.");
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

  const handleVerify = async () => {
    if (!code.trim()) return;

    setLoading(true);
    try {
      const result = await signUp?.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (result?.status === "complete") {
        await setSignUpActive?.({ session: result.createdSessionId });
        return;
      }

      Alert.alert(
        "Verification incomplete",
        "The code did not complete sign-up.",
      );
    } catch (error: unknown) {
      logger.warn(loggerMessages.mobile.authSignInFailed, {
        attributes: { mode: "sign_up", provider: "email_code" },
        error,
      });
      Alert.alert("Verification failed", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((value) => (value === "sign-in" ? "sign-up" : "sign-in"));
    setPendingVerification(false);
    setCode("");
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.centered}
    >
      <Text style={styles.appName}>Field Log</Text>
      <Text style={styles.tagline}>Your EDC, organized.</Text>

      {pendingVerification ? (
        <View style={styles.form}>
          <Text style={styles.title}>Verify email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="number-pad"
            onChangeText={setCode}
            placeholder="Email code"
            placeholderTextColor={C.textMuted}
            style={styles.input}
            value={code}
          />
          <Pressable style={styles.primaryButton} onPress={handleVerify}>
            <Text style={styles.primaryButtonText}>Verify</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.form}>
          <Pressable
            style={[styles.oauthButton, styles.googleButton]}
            onPress={handleGoogle}
          >
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </Pressable>

          <Text style={styles.title}>
            {isSignUp ? "Create account" : "Sign in"}
          </Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={C.textMuted}
            style={styles.input}
            value={email}
          />
          <TextInput
            autoComplete={isSignUp ? "new-password" : "current-password"}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={C.textMuted}
            secureTextEntry
            style={styles.input}
            value={password}
          />

          <Pressable style={styles.primaryButton} onPress={handleEmail}>
            <Text style={styles.primaryButtonText}>
              {isSignUp ? "Create account" : "Sign in"}
            </Text>
          </Pressable>

          <Pressable onPress={switchMode} style={styles.linkRow}>
            <Text style={styles.link}>
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </Text>
          </Pressable>
          <View nativeID="clerk-captcha" />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const styles = StyleSheet.create({
  appName: {
    color: C.text,
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 6,
  },
  centered: {
    alignItems: "center",
    backgroundColor: C.bg,
    flex: 1,
    justifyContent: "center",
    padding: 32,
  },
  form: { gap: 12, width: "100%" },
  googleButton: {
    backgroundColor: C.bgCard,
    borderColor: C.border,
    borderWidth: 1.5,
  },
  googleButtonText: { color: C.text, fontSize: 15, fontWeight: "600" },
  input: {
    backgroundColor: C.bgInput,
    borderColor: C.border,
    borderRadius: 8,
    borderWidth: 1,
    color: C.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: "100%",
  },
  link: { color: C.accentBright, fontSize: 14 },
  linkRow: { alignItems: "center", marginTop: 4 },
  oauthButton: {
    alignItems: "center",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    width: "100%",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: C.accent,
    borderRadius: 8,
    marginTop: 4,
    paddingVertical: 14,
    width: "100%",
  },
  primaryButtonText: { color: C.text, fontSize: 15, fontWeight: "700" },
  tagline: { color: C.textMuted, fontSize: 16, marginBottom: 36 },
  title: {
    alignSelf: "flex-start",
    color: C.text,
    fontSize: 26,
    fontWeight: "700",
    marginTop: 16,
  },
});
