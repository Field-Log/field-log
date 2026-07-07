import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { initDatabase } from "./src/db/database";
import { uploadAllItems } from "./src/db/sync";
import AddScreen from "./src/screens/AddScreen";
import AuthScreen from "./src/screens/AuthScreen";
import LibraryScreen from "./src/screens/LibraryScreen";
import LogScreen from "./src/screens/LogScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import StatsScreen from "./src/screens/StatsScreen";

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
  const [databaseReady, setDatabaseReady] = useState(false);
  const userId = user?.uid;

  useEffect(() => {
    void initDatabase().then(() => setDatabaseReady(true));
  }, []);

  // On first sign-in, upload local items to the cloud
  useEffect(() => {
    if (!userId) return;

    uploadAllItems(userId).catch(() => {
      // Non-fatal — local data is always the source of truth
    });
  }, [userId]);

  if (loading || !databaseReady) {
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
