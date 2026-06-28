import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LibraryList from "./LibraryList";
import ItemDetailScreen from "./ItemDetailScreen";
import AddLogScreen from "./AddLogScreen";
import EditItemScreen from "./EditItemScreen";

const Stack = createNativeStackNavigator();

export default function LibraryScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="LibraryList"
        component={LibraryList}
        options={{ title: "Library" }}
      />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ title: "Details" }}
      />
      <Stack.Screen
        name="AddLog"
        component={AddLogScreen}
        options={{ title: "Add Log Entry" }}
      />
      <Stack.Screen
        name="EditItem"
        component={EditItemScreen}
        options={{ title: "Edit Item" }}
      />
    </Stack.Navigator>
  );
}
