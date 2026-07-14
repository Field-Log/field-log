import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import AddLogScreen from "./AddLogScreen";
import EditItemScreen from "./EditItemScreen";
import ItemDetailScreen from "./ItemDetailScreen";
import LibraryList from "./LibraryList";

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
