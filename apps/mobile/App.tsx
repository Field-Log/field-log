import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { loggerMessages } from "@package/logger";
import {
  type BottomTabBarButtonProps,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { type ReactElement, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AccountMenuButton } from "./src/components/AccountMenuButton";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { initDatabase } from "./src/db/database";
import {
  setCurrentSyncUserId,
  syncCurrentUserDataBestEffort,
} from "./src/db/sync";
import { mobileEnv } from "./src/env";
import { logger } from "./src/lib/logger";
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
  return <View style={{ backgroundColor: C.bg, flex: 1 }} />;
}

function AppGate(): ReactElement {
  const { user, loading } = useAuth();
  const [databaseReady, setDatabaseReady] = useState(false);
  const userId = user?.id;

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

  // On sign-in, restore an empty local database or upload local changes.
  useEffect(() => {
    if (!userId || !databaseReady) return;
    syncCurrentUserDataBestEffort(userId);
  }, [databaseReady, userId]);

  if (loading || !databaseReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return user ? <MainTabs /> : <AuthScreen />;
}

export default function App(): ReactElement {
  return (
    <ClerkProvider
      publishableKey={mobileEnv.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <AuthProvider>
        <NavigationContainer>
          <AppGate />
        </NavigationContainer>
      </AuthProvider>
    </ClerkProvider>
  );
}
