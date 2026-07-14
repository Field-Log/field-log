import { AuthView, type AuthViewMode } from "@clerk/expo/native";
import { type ReactElement, useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { C } from "../theme/colors";

export default function AuthScreen(): ReactElement {
  const [authMode, setAuthMode] = useState<AuthViewMode>("signInOrUp");
  const [authOpen, setAuthOpen] = useState(false);

  function openAuth(mode: AuthViewMode): void {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.shell}>
        <Text style={styles.appName}>Field Log</Text>
        <Text style={styles.tagline}>Your EDC, organized.</Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => openAuth("signIn")}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Sign in</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => openAuth("signUp")}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Create account</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setAuthOpen(false)}
        presentationStyle="pageSheet"
        visible={authOpen}
      >
        <SafeAreaView style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {authMode === "signUp" ? "Create account" : "Sign in"}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setAuthOpen(false)}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>Done</Text>
            </Pressable>
          </View>
          <View style={styles.authHost}>
            <AuthView
              isDismissible
              mode={authMode}
              onDismiss={() => setAuthOpen(false)}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
    width: "100%",
  },
  appName: {
    color: C.text,
    fontSize: 34,
    fontWeight: "800",
  },
  authHost: {
    flex: 1,
  },
  headerButton: {
    backgroundColor: C.bgMuted,
    borderColor: C.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  headerButtonText: { color: C.text, fontSize: 13, fontWeight: "700" },
  modalHeader: {
    alignItems: "center",
    borderBottomColor: C.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalScreen: {
    backgroundColor: C.bg,
    flex: 1,
  },
  modalTitle: { color: C.text, fontSize: 18, fontWeight: "700" },
  primaryButton: {
    alignItems: "center",
    backgroundColor: C.accent,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonText: { color: C.text, fontSize: 15, fontWeight: "700" },
  screen: {
    backgroundColor: C.bg,
    flex: 1,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: C.bgMuted,
    borderColor: C.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButtonText: { color: C.text, fontSize: 15, fontWeight: "700" },
  shell: {
    alignItems: "center",
    flex: 1,
    gap: 8,
    justifyContent: "center",
    padding: 32,
  },
  tagline: {
    color: C.textMuted,
    fontSize: 15,
    marginBottom: 28,
  },
});
