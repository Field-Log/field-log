import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import AddItemScreen from "./AddItemScreen";
import ChooseItemTypeScreen from "./ChooseItemTypeScreen";

const Stack = createNativeStackNavigator();

export default function AddScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ChooseItemType"
        component={ChooseItemTypeScreen}
        options={{ title: "Add Item" }}
      />
      <Stack.Screen
        name="AddItem"
        component={AddItemScreen}
        options={{ title: "Add Item" }}
      />
    </Stack.Navigator>
  );
}
