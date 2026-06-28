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
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { auth } from "../config/firebase";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID =
  "987730931157-mamj2vf7c6nlteqkbrq6fsdfo2rf0nip.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID =
  "987730931157-6f067fjcrqcn3jnj12d6vlionj77e2et.apps.googleusercontent.com";

export default function AuthScreen() {
  const [mode, setMode] = useState<"landing" | "email">("landing");
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [, googleResponse, googlePrompt] = AuthSession.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  // Handle Google OAuth response
  React.useEffect(() => {
    if (googleResponse?.type === "success") {
      const { id_token } = googleResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);
      setLoading(true);
      signInWithCredential(auth, credential)
        .catch((e) => Alert.alert("Google sign-in failed", e.message))
        .finally(() => setLoading(false));
    }
  }, [googleResponse]);

  const handleApple = async () => {
    try {
      setLoading(true);
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const provider = new OAuthProvider("apple.com");
      const credential = provider.credential({
        idToken: appleCredential.identityToken!,
        rawNonce: appleCredential.authorizationCode ?? undefined,
      });
      await signInWithCredential(auth, credential);
    } catch (e: any) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Apple sign-in failed", e.message);
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
    } catch (e: any) {
      Alert.alert(isSignUp ? "Sign up failed" : "Sign in failed", e.message);
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

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#fff",
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    color: "#888",
    marginBottom: 52,
  },
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
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#ddd",
  },
  googleButtonText: { fontSize: 15, fontWeight: "600", color: "#222" },
  emailButton: { backgroundColor: "#4a90e2" },
  emailButtonText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 28,
    alignSelf: "flex-start",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#4a90e2",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  linkRow: { marginTop: 16 },
  link: { color: "#4a90e2", fontSize: 14 },
});
