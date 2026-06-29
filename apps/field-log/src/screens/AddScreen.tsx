import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChooseItemTypeScreen from "./ChooseItemTypeScreen";
import AddItemScreen from "./AddItemScreen";

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
