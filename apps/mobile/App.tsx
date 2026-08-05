import { ClerkProvider, useAuth as useClerkAuth, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { loggerMessages } from "@package/logger";
import { nativeIndicators, nativeNavigationTheme } from "@package/theme";
import {
  type BottomTabBarButtonProps,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { type ReactElement, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  type AppStateStatus,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import "./global.css";
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

const Tab = createBottomTabNavigator<MainTabParamList>();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    ...nativeNavigationTheme.colors,
  },
};

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
  return <View className="flex-1 bg-background" />;
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
    <View className="dark flex-1 items-center justify-center bg-background p-6">
      <View className="w-full max-w-sm rounded-lg border border-border bg-card p-5">
        <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
          Update required
        </Text>
        <Text className="mb-2.5 text-center text-2xl font-bold leading-7 text-foreground">
          Install the latest Field Log
        </Text>
        <Text className="mb-5 text-center text-sm leading-5 text-muted-foreground">
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
            className="min-h-11 items-center rounded-lg bg-primary px-4 py-3"
          >
            <Text className="text-base font-bold text-primary-foreground">
              Open store
            </Text>
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
    <View className="flex-row items-center gap-3 border-b border-border bg-card px-4 py-3">
      <View className="flex-1">
        <Text className="text-sm font-bold text-foreground">
          Update available
        </Text>
        <Text className="text-xs leading-4 text-muted-foreground">
          A newer Field Log version is ready.
        </Text>
      </View>
      <View className="flex-row gap-2">
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
            className="min-h-9 items-center rounded-lg bg-accent px-3.5 py-2"
          >
            <Text className="text-sm font-bold text-accent-foreground">
              Update
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={onDismiss}
          className="min-h-9 items-center rounded-lg border border-border px-3.5 py-2"
        >
          <Text className="text-sm font-semibold text-muted-foreground">
            Later
          </Text>
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
      <View className="dark flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={nativeIndicators.activity} size="large" />
      </View>
    );
  }

  const showRecommendedUpdate =
    mobileUpdateDecision?.severity === "recommended" &&
    !recommendedUpdateDismissed;

  return (
    <View className="dark flex-1 bg-background">
      {showRecommendedUpdate ? (
        <MobileUpdateBanner
          onDismiss={() => setRecommendedUpdateDismissed(true)}
          policy={mobileUpdateDecision.policy}
        />
      ) : null}
      <View className="flex-1">
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
      <NavigationContainer theme={navigationTheme}>
        <AppGate />
      </NavigationContainer>
    </ClerkProvider>
  );
}
