import { ClerkProvider, useAuth as useClerkAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { loggerMessages } from "@package/logger";
import {
  type BottomTabBarButtonProps,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { type ReactElement, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  type AppStateStatus,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AccountMenuButton } from "./src/components/AccountMenuButton";
import { initDatabase } from "./src/db/database";
import {
  setCurrentSyncUserId,
  syncCurrentUserDataBestEffort,
} from "./src/db/sync";
import { mobileEnv } from "./src/env";
import { logger } from "./src/lib/logger";
import {
  fetchMobileVersionPolicy,
  getMobileUpdateDecision,
  type MobileUpdateDecision,
  type MobileVersionPolicy,
} from "./src/lib/mobile-version-policy";
import { type MainTabParamList } from "./src/navigation/types";
import AddScreen from "./src/screens/AddScreen";
import AuthScreen from "./src/screens/AuthScreen";
import CollectionsScreen from "./src/screens/CollectionsScreen";
import LibraryScreen from "./src/screens/LibraryScreen";
import LogScreen from "./src/screens/LogScreen";
import StatsScreen from "./src/screens/StatsScreen";
import { C } from "./src/theme/colors";

const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs(): ReactElement {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Log" component={LogScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Add" component={AddScreen} />
      <Tab.Screen
        name="Collections"
        component={CollectionsScreen}
        options={{
          tabBarButton: () => null,
          title: "Collections",
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountTabPlaceholder}
        options={{
          tabBarButton: (props: BottomTabBarButtonProps) => (
            <AccountMenuButton tabBarButtonProps={props} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AccountTabPlaceholder(): ReactElement {
  return <View style={styles.accountTabPlaceholder} />;
}

function isAbortError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

function getPlatformStoreUrl(policy: MobileVersionPolicy) {
  return Platform.OS === "ios" ? policy.iosStoreUrl : policy.androidStoreUrl;
}

function MobileUpdateRequiredScreen({
  policy,
}: {
  policy: MobileVersionPolicy;
}) {
  const storeUrl = getPlatformStoreUrl(policy);

  return (
    <View style={styles.updateRequiredShell}>
      <View style={styles.updateRequiredPanel}>
        <Text style={styles.updateEyebrow}>Update required</Text>
        <Text style={styles.updateTitle}>Install the latest Field Log</Text>
        <Text style={styles.updateBody}>
          This app version is no longer supported. Update before continuing.
        </Text>
        {storeUrl ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              Linking.openURL(storeUrl).catch((error: unknown) => {
                logger.warn(
                  loggerMessages.mobile.versionPolicyStoreOpenFailed,
                  { error },
                );
              });
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Open store</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function MobileUpdateBanner({
  onDismiss,
  policy,
}: {
  onDismiss: () => void;
  policy: MobileVersionPolicy;
}) {
  const storeUrl = getPlatformStoreUrl(policy);

  return (
    <View style={styles.updateBanner}>
      <View style={styles.updateBannerCopy}>
        <Text style={styles.updateBannerTitle}>Update available</Text>
        <Text style={styles.updateBannerBody}>
          A newer Field Log version is ready.
        </Text>
      </View>
      <View style={styles.updateBannerActions}>
        {storeUrl ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              Linking.openURL(storeUrl).catch((error: unknown) => {
                logger.warn(
                  loggerMessages.mobile.versionPolicyStoreOpenFailed,
                  { error },
                );
              });
            }}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Update</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={onDismiss}
          style={styles.dismissButton}
        >
          <Text style={styles.dismissButtonText}>Later</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AppGate(): ReactElement {
  const { isLoaded: authLoaded, isSignedIn } = useClerkAuth({
    treatPendingAsSignedOut: false,
  });
  const { isLoaded: userLoaded, user } = useUser();
  const [databaseReady, setDatabaseReady] = useState(false);
  const [mobileUpdateDecision, setMobileUpdateDecision] =
    useState<MobileUpdateDecision | null>(null);
  const [recommendedUpdateDismissed, setRecommendedUpdateDismissed] =
    useState(false);
  const userId = user?.id;

  const refreshMobileVersionPolicy = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const policy = await fetchMobileVersionPolicy({ signal });
        const decision = getMobileUpdateDecision(policy);

        setMobileUpdateDecision(decision);
        if (decision?.severity === "required") {
          setRecommendedUpdateDismissed(false);
        }
      } catch (error: unknown) {
        if (!isAbortError(error)) {
          logger.warn(loggerMessages.mobile.versionPolicyFetchFailed, {
            error,
          });
        }
      }
    },
    [],
  );

  useEffect(() => {
    initDatabase()
      .then(() => setDatabaseReady(true))
      .catch((error: unknown) => {
        logger.error(loggerMessages.mobile.databaseInitFailed, { error });
      });
  }, []);

  useEffect(() => {
    setCurrentSyncUserId(userId ?? null);
    return () => setCurrentSyncUserId(null);
  }, [userId]);

  useEffect(() => {
    const abortController = new AbortController();

    refreshMobileVersionPolicy(abortController.signal);

    const subscription = AppState.addEventListener(
      "change",
      (status: AppStateStatus) => {
        if (status === "active") {
          refreshMobileVersionPolicy();
        }
      },
    );

    return () => {
      abortController.abort();
      subscription.remove();
    };
  }, [refreshMobileVersionPolicy]);

  // On sign-in, restore an empty local database or upload local changes.
  useEffect(() => {
    if (!userId || !databaseReady) return;
    syncCurrentUserDataBestEffort(userId);
  }, [databaseReady, userId]);

  if (mobileUpdateDecision?.severity === "required") {
    return <MobileUpdateRequiredScreen policy={mobileUpdateDecision.policy} />;
  }

  if (!authLoaded || !userLoaded || !databaseReady) {
    return (
      <View style={styles.loadingShell}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const showRecommendedUpdate =
    mobileUpdateDecision?.severity === "recommended" &&
    !recommendedUpdateDismissed;

  return (
    <View style={styles.appShell}>
      {showRecommendedUpdate ? (
        <MobileUpdateBanner
          onDismiss={() => setRecommendedUpdateDismissed(true)}
          policy={mobileUpdateDecision.policy}
        />
      ) : null}
      <View style={styles.appContent}>
        {isSignedIn && user ? <MainTabs /> : <AuthScreen />}
      </View>
    </View>
  );
}

export default function App(): ReactElement {
  return (
    <ClerkProvider
      publishableKey={mobileEnv.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <NavigationContainer>
        <AppGate />
      </NavigationContainer>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  accountTabPlaceholder: {
    backgroundColor: C.bg,
    flex: 1,
  },
  appContent: {
    flex: 1,
  },
  appShell: {
    backgroundColor: C.bg,
    flex: 1,
  },
  dismissButton: {
    alignItems: "center",
    borderColor: C.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dismissButtonText: {
    color: C.textSub,
    fontSize: 13,
    fontWeight: "600",
  },
  loadingShell: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: C.accentBright,
    borderRadius: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: C.text,
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: C.accent,
    borderRadius: 8,
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
  },
  updateBanner: {
    alignItems: "center",
    backgroundColor: C.bgCard,
    borderBottomColor: C.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  updateBannerActions: {
    flexDirection: "row",
    gap: 8,
  },
  updateBannerBody: {
    color: C.textSub,
    fontSize: 12,
    lineHeight: 17,
  },
  updateBannerCopy: {
    flex: 1,
  },
  updateBannerTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
  },
  updateBody: {
    color: C.textSub,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
    textAlign: "center",
  },
  updateEyebrow: {
    color: C.accentBright,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  updateRequiredPanel: {
    backgroundColor: C.bgCard,
    borderColor: C.border,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 360,
    padding: 20,
    width: "100%",
  },
  updateRequiredShell: {
    alignItems: "center",
    backgroundColor: C.bg,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  updateTitle: {
    color: C.text,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
    marginBottom: 10,
    textAlign: "center",
  },
});
