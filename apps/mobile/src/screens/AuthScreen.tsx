import { AuthView, type AuthViewMode } from "@clerk/expo/native";
import { type ReactElement, useState } from "react";
import { Modal, Pressable, SafeAreaView, Text, View } from "react-native";

export default function AuthScreen(): ReactElement {
  const [authMode, setAuthMode] = useState<AuthViewMode>("signInOrUp");
  const [authOpen, setAuthOpen] = useState(false);

  function openAuth(mode: AuthViewMode): void {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-2 p-8">
        <Text className="text-4xl font-extrabold text-foreground">
          Pocket Trash
        </Text>
        <Text className="mb-7 text-base text-muted-foreground">
          Your EDC, organized.
        </Text>
        <View className="w-full gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => openAuth("signIn")}
            className="min-h-12 items-center justify-center rounded-lg bg-accent px-4"
          >
            <Text className="text-base font-bold text-accent-foreground">
              Sign in
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => openAuth("signUp")}
            className="min-h-12 items-center justify-center rounded-lg border border-border bg-sidebar-accent px-4"
          >
            <Text className="text-base font-bold text-foreground">
              Create account
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setAuthOpen(false)}
        presentationStyle="pageSheet"
        visible={authOpen}
      >
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
            <Text className="text-lg font-bold text-foreground">
              {authMode === "signUp" ? "Create account" : "Sign in"}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setAuthOpen(false)}
              className="rounded-lg border border-border bg-sidebar-accent px-3.5 py-2"
            >
              <Text className="text-sm font-bold text-foreground">Done</Text>
            </Pressable>
          </View>
          <View className="flex-1">
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
