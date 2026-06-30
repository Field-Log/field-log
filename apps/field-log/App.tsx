import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import LibraryScreen from "./src/screens/LibraryScreen";
import LogScreen from "./src/screens/LogScreen";
import AddScreen from "./src/screens/AddScreen";
import StatsScreen from "./src/screens/StatsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import AuthScreen from "./src/screens/AuthScreen";

import { initDatabase } from "./src/db/database";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { uploadAllItems } from "./src/db/sync";

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Log" component={LogScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Add" component={AddScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AppGate() {
  const { user, loading } = useAuth();
  const userId = user?.uid;

  useEffect(() => {
    initDatabase();
  }, []);

  // On first sign-in, upload local items to the cloud
  useEffect(() => {
    if (!userId) return;

    uploadAllItems(userId).catch(() => {
      // Non-fatal — local data is always the source of truth
    });
  }, [userId]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return user ? <MainTabs /> : <AuthScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppGate />
      </NavigationContainer>
    </AuthProvider>
  );
}
