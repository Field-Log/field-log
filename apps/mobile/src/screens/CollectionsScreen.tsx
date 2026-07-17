import { type ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { C } from "../theme/colors";

export default function CollectionsScreen(): ReactElement {
  return <View style={styles.screen} />;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: C.bg, flex: 1 },
});
