import {
  ClerkProvider,
  useAuth,
  useClerk,
  useSignIn,
  useSignUp,
  useUser,
} from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { StatusBar } from "expo-status-bar";
import { type ReactElement, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { mobileEnv } from "./src/env";

type AppScreen = "archive" | "collections";
type AuthMode = "sign-in" | "sign-up";

export default function App(): ReactElement {
  return (
    <ClerkProvider
      publishableKey={mobileEnv.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <MobileShell />
    </ClerkProvider>
  );
}

function MobileShell(): ReactElement {
  const { isLoaded, isSignedIn } = useAuth();
  const [screen, setScreen] = useState<AppScreen>("archive");
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  function openAuth(mode: AuthMode): void {
    setAuthMode(mode);
    setIsAuthOpen(true);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setScreen("archive")}
          style={({ pressed }) => [
            styles.brandButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.headerEyebrow}>Machined Pens</Text>
          <Text style={styles.headerTitle}>Autmog archive</Text>
        </Pressable>
        {isLoaded ? (
          <UserMenu
            isSignedIn={Boolean(isSignedIn)}
            onCollections={() => setScreen("collections")}
            onSignIn={() => openAuth("sign-in")}
          />
        ) : (
          <ActivityIndicator color={palette.foreground} />
        )}
      </View>

      {screen === "collections" ? (
        <CollectionsScreen />
      ) : (
        <ArchiveScreen isSignedIn={Boolean(isSignedIn)} onSignIn={openAuth} />
      )}

      <AuthModal
        mode={authMode}
        onAuthenticated={() => setIsAuthOpen(false)}
        onChangeMode={setAuthMode}
        onClose={() => setIsAuthOpen(false)}
        visible={isAuthOpen}
      />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

function ArchiveScreen({
  isSignedIn,
  onSignIn,
}: {
  isSignedIn: boolean;
  onSignIn: (mode: AuthMode) => void;
}): ReactElement {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.archivePanel}>
        <Text style={styles.eyebrow}>Machined Pens</Text>
        <Text style={styles.title}>Autmog archive</Text>
        <Text style={styles.body}>
          Native iOS and Android shell for the machined pen archive.
        </Text>
        {isSignedIn ? (
          <Text style={styles.statusText}>Signed in</Text>
        ) : (
          <View style={styles.authActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onSignIn("sign-in")}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Sign in</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onSignIn("sign-up")}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Create account</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function CollectionsScreen(): ReactElement {
  return (
    <View style={styles.content}>
      <Text style={styles.title}>Collections</Text>
    </View>
  );
}

function UserMenu({
  isSignedIn,
  onCollections,
  onSignIn,
}: {
  isSignedIn: boolean;
  onCollections: () => void;
  onSignIn: () => void;
}): ReactElement {
  const clerk = useClerk();
  const { user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  if (!isSignedIn) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onSignIn}
        style={({ pressed }) => [
          styles.headerAction,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.headerActionText}>Sign in</Text>
      </Pressable>
    );
  }

  const displayName =
    user?.username ??
    user?.fullName ??
    user?.primaryEmailAddress?.emailAddress ??
    "User";

  return (
    <>
      <Pressable
        accessibilityLabel="Account menu"
        accessibilityRole="button"
        onPress={() => setIsMenuOpen(true)}
        style={({ pressed }) => [
          styles.avatarButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.avatarText}>{initialsFor(displayName)}</Text>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
        transparent={true}
        visible={isMenuOpen}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsMenuOpen(false)}
          style={styles.menuScrim}
        >
          <Pressable style={styles.menuPanel}>
            <Text style={styles.menuName}>{displayName}</Text>
            <Text numberOfLines={1} style={styles.menuEmail}>
              {user?.primaryEmailAddress?.emailAddress ?? "Account"}
            </Text>
            <View style={styles.menuDivider} />
            <MenuItem
              label="Account"
              onPress={() => {
                setIsMenuOpen(false);
                setIsAccountOpen(true);
              }}
            />
            <MenuItem
              label="Collections"
              onPress={() => {
                setIsMenuOpen(false);
                onCollections();
              }}
            />
            <View style={styles.menuDivider} />
            <MenuItem
              destructive={true}
              label="Sign out"
              onPress={() => {
                setIsMenuOpen(false);
                void clerk.signOut();
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setIsAccountOpen(false)}
        presentationStyle="pageSheet"
        visible={isAccountOpen}
      >
        <SafeAreaView style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Account</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsAccountOpen(false)}
              style={({ pressed }) => [
                styles.headerAction,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.headerActionText}>Done</Text>
            </Pressable>
          </View>
          <View style={styles.accountBody}>
            <Text style={styles.accountLabel}>Name</Text>
            <Text style={styles.accountValue}>{displayName}</Text>
            <Text style={styles.accountLabel}>Email</Text>
            <Text style={styles.accountValue}>
              {user?.primaryEmailAddress?.emailAddress ?? "Not set"}
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

function MenuItem({
  destructive = false,
  label,
  onPress,
}: {
  destructive?: boolean;
  label: string;
  onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
    >
      <Text style={destructive ? styles.menuItemDanger : styles.menuItemText}>
        {label}
      </Text>
    </Pressable>
  );
}

function AuthModal({
  mode,
  onAuthenticated,
  onChangeMode,
  onClose,
  visible,
}: {
  mode: AuthMode;
  onAuthenticated: () => void;
  onChangeMode: (mode: AuthMode) => void;
  onClose: () => void;
  visible: boolean;
}): ReactElement {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <SafeAreaView style={styles.modalScreen}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {mode === "sign-in" ? "Sign in" : "Create account"}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.headerAction,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.headerActionText}>Close</Text>
          </Pressable>
        </View>
        {mode === "sign-in" ? (
          <SignInForm
            onAuthenticated={onAuthenticated}
            onSignUp={() => onChangeMode("sign-up")}
          />
        ) : (
          <SignUpForm
            onAuthenticated={onAuthenticated}
            onSignIn={() => onChangeMode("sign-in")}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

function SignInForm({
  onAuthenticated,
  onSignUp,
}: {
  onAuthenticated: () => void;
  onSignUp: () => void;
}): ReactElement {
  const { errors, fetchStatus, signIn } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isSubmitting = fetchStatus === "fetching";
  const needsEmailCode = signIn?.status === "needs_client_trust";

  async function handlePassword(): Promise<void> {
    setFormError(null);
    const result = await signIn.password({
      emailAddress: emailAddress.trim(),
      password,
    });

    if (result.error) {
      setFormError(result.error.message);
      return;
    }

    if (signIn.status === "complete") {
      const finalizeResult = await signIn.finalize();
      if (finalizeResult.error) {
        setFormError(finalizeResult.error.message);
        return;
      }
      onAuthenticated();
      return;
    }

    if (signIn.status === "needs_client_trust") {
      const sendResult = await signIn.emailCode.sendCode();
      if (sendResult.error) {
        setFormError(sendResult.error.message);
      }
      return;
    }

    setFormError("This sign-in flow needs another step.");
  }

  async function handleCode(): Promise<void> {
    setFormError(null);
    const result = await signIn.emailCode.verifyCode({ code });

    if (result.error) {
      setFormError(result.error.message);
      return;
    }

    if (signIn.status === "complete") {
      const finalizeResult = await signIn.finalize();
      if (finalizeResult.error) {
        setFormError(finalizeResult.error.message);
        return;
      }
      onAuthenticated();
      return;
    }

    setFormError("The verification code did not complete sign-in.");
  }

  if (needsEmailCode) {
    return (
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.formLabel}>Verification code</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="number-pad"
          onChangeText={setCode}
          placeholder="Enter code"
          placeholderTextColor={palette.muted}
          style={styles.input}
          value={code}
        />
        <FieldError message={errors.fields.code?.message ?? formError} />
        <Pressable
          accessibilityRole="button"
          disabled={!code || isSubmitting}
          onPress={() => void handleCode()}
          style={({ pressed }) => [
            styles.primaryButton,
            (!code || isSubmitting) && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Verify</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => signIn.reset()}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Start over</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.form}>
      <Text style={styles.formLabel}>Email address</Text>
      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        onChangeText={setEmailAddress}
        placeholder="name@example.com"
        placeholderTextColor={palette.muted}
        style={styles.input}
        value={emailAddress}
      />
      <FieldError message={errors.fields.identifier?.message} />
      <Text style={styles.formLabel}>Password</Text>
      <TextInput
        autoComplete="password"
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={palette.muted}
        secureTextEntry={true}
        style={styles.input}
        value={password}
      />
      <FieldError message={errors.fields.password?.message ?? formError} />
      <Pressable
        accessibilityRole="button"
        disabled={!emailAddress || !password || isSubmitting}
        onPress={() => void handlePassword()}
        style={({ pressed }) => [
          styles.primaryButton,
          (!emailAddress || !password || isSubmitting) && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onSignUp}
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.secondaryButtonText}>Create account</Text>
      </Pressable>
    </ScrollView>
  );
}

function SignUpForm({
  onAuthenticated,
  onSignIn,
}: {
  onAuthenticated: () => void;
  onSignIn: () => void;
}): ReactElement {
  const { errors, fetchStatus, signUp } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isSubmitting = fetchStatus === "fetching";
  const needsEmailCode =
    signUp?.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  async function handlePassword(): Promise<void> {
    setFormError(null);
    const result = await signUp.password({
      emailAddress: emailAddress.trim(),
      password,
    });

    if (result.error) {
      setFormError(result.error.message);
      return;
    }

    if (signUp.status === "complete") {
      const finalizeResult = await signUp.finalize();
      if (finalizeResult.error) {
        setFormError(finalizeResult.error.message);
        return;
      }
      onAuthenticated();
      return;
    }

    if (
      signUp.status === "missing_requirements" &&
      signUp.unverifiedFields.includes("email_address")
    ) {
      const sendResult = await signUp.verifications.sendEmailCode();
      if (sendResult.error) {
        setFormError(sendResult.error.message);
      }
      return;
    }

    setFormError("This sign-up flow needs another step.");
  }

  async function handleCode(): Promise<void> {
    setFormError(null);
    const result = await signUp.verifications.verifyEmailCode({ code });

    if (result.error) {
      setFormError(result.error.message);
      return;
    }

    if (signUp.status === "complete") {
      const finalizeResult = await signUp.finalize();
      if (finalizeResult.error) {
        setFormError(finalizeResult.error.message);
        return;
      }
      onAuthenticated();
      return;
    }

    setFormError("The verification code did not complete sign-up.");
  }

  if (needsEmailCode) {
    return (
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.formLabel}>Verification code</Text>
        <TextInput
          autoCapitalize="none"
          keyboardType="number-pad"
          onChangeText={setCode}
          placeholder="Enter code"
          placeholderTextColor={palette.muted}
          style={styles.input}
          value={code}
        />
        <FieldError message={errors.fields.code?.message ?? formError} />
        <Pressable
          accessibilityRole="button"
          disabled={!code || isSubmitting}
          onPress={() => void handleCode()}
          style={({ pressed }) => [
            styles.primaryButton,
            (!code || isSubmitting) && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Verify</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void signUp.verifications.sendEmailCode()}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Send new code</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.form}>
      <Text style={styles.formLabel}>Email address</Text>
      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        onChangeText={setEmailAddress}
        placeholder="name@example.com"
        placeholderTextColor={palette.muted}
        style={styles.input}
        value={emailAddress}
      />
      <FieldError message={errors.fields.emailAddress?.message} />
      <Text style={styles.formLabel}>Password</Text>
      <TextInput
        autoComplete="new-password"
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={palette.muted}
        secureTextEntry={true}
        style={styles.input}
        value={password}
      />
      <FieldError message={errors.fields.password?.message ?? formError} />
      <Pressable
        accessibilityRole="button"
        disabled={!emailAddress || !password || isSubmitting}
        onPress={() => void handlePassword()}
        style={({ pressed }) => [
          styles.primaryButton,
          (!emailAddress || !password || isSubmitting) && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>Create account</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onSignIn}
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.secondaryButtonText}>Sign in</Text>
      </Pressable>
      <View nativeID="clerk-captcha" />
    </ScrollView>
  );
}

function FieldError({
  message,
}: {
  message?: string | null;
}): ReactElement | null {
  if (!message) return null;
  return <Text style={styles.errorText}>{message}</Text>;
}

function initialsFor(value: string): string {
  return value.trim().charAt(0).toUpperCase() || "U";
}

const palette = {
  accent: "#4338ca",
  background: "#f8fafc",
  border: "#d8dee8",
  danger: "#b42318",
  foreground: "#171923",
  muted: "#687082",
  panel: "#ffffff",
  secondary: "#edf1f7",
};

const styles = StyleSheet.create({
  accountBody: {
    gap: 8,
    padding: 20,
  },
  accountLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 12,
    textTransform: "uppercase",
  },
  accountValue: {
    color: palette.foreground,
    fontSize: 16,
  },
  archivePanel: {
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  authActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  avatarButton: {
    alignItems: "center",
    backgroundColor: palette.foreground,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  avatarText: {
    color: palette.panel,
    fontSize: 14,
    fontWeight: "700",
  },
  body: {
    color: palette.muted,
    fontSize: 17,
    lineHeight: 24,
  },
  brandButton: {
    flexShrink: 1,
    gap: 2,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  disabled: {
    opacity: 0.48,
  },
  errorText: {
    color: palette.danger,
    fontSize: 12,
    lineHeight: 17,
  },
  eyebrow: {
    color: palette.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  form: {
    gap: 10,
    padding: 20,
  },
  formLabel: {
    color: palette.foreground,
    fontSize: 13,
    fontWeight: "700",
  },
  header: {
    alignItems: "center",
    backgroundColor: palette.panel,
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerAction: {
    alignItems: "center",
    backgroundColor: palette.secondary,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerActionText: {
    color: palette.foreground,
    fontSize: 13,
    fontWeight: "700",
  },
  headerEyebrow: {
    color: palette.accent,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  headerTitle: {
    color: palette.foreground,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    color: palette.foreground,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  menuDivider: {
    backgroundColor: palette.border,
    height: 1,
    marginVertical: 8,
  },
  menuEmail: {
    color: palette.muted,
    fontSize: 13,
  },
  menuItem: {
    borderRadius: 8,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  menuItemDanger: {
    color: palette.danger,
    fontSize: 15,
    fontWeight: "700",
  },
  menuItemText: {
    color: palette.foreground,
    fontSize: 15,
    fontWeight: "700",
  },
  menuName: {
    color: palette.foreground,
    fontSize: 16,
    fontWeight: "700",
  },
  menuPanel: {
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: "auto",
    marginRight: 16,
    marginTop: 64,
    padding: 12,
    width: 260,
  },
  menuScrim: {
    backgroundColor: "rgba(15, 23, 42, 0.24)",
    flex: 1,
  },
  modalHeader: {
    alignItems: "center",
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalScreen: {
    backgroundColor: palette.background,
    flex: 1,
  },
  modalTitle: {
    color: palette.foreground,
    fontSize: 18,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.72,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: palette.foreground,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: palette.panel,
    fontSize: 15,
    fontWeight: "700",
  },
  screen: {
    backgroundColor: palette.background,
    flex: 1,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: palette.secondary,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: palette.foreground,
    fontSize: 15,
    fontWeight: "700",
  },
  statusText: {
    color: palette.foreground,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  title: {
    color: palette.foreground,
    fontSize: 34,
    fontWeight: "700",
  },
});
