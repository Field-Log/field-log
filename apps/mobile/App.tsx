import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Machined Pens</Text>
        <Text style={styles.title}>Autmog archive</Text>
        <Text style={styles.body}>
          Native iOS and Android shell for the machined pen archive.
        </Text>
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f7f7f5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  eyebrow: {
    color: "#7a4a26",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: "#1d1f25",
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 12,
  },
  body: {
    color: "#525866",
    fontSize: 17,
    lineHeight: 24,
  },
});
