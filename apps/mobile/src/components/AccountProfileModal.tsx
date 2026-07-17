import { UserProfileView } from "@clerk/expo/native";
import { type ReactElement } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { C } from "../theme/colors";

type AccountProfileModalProps = {
  onClose: () => void;
  visible: boolean;
};

export function AccountProfileModal({
  onClose,
  visible,
}: AccountProfileModalProps): ReactElement {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Account</Text>
          <Pressable
            accessibilityLabel="Close account"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>X</Text>
          </Pressable>
        </View>
        <UserProfileView
          isDismissible={false}
          onDismiss={onClose}
          style={styles.profileView}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: "center",
    backgroundColor: C.bgMuted,
    borderColor: C.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  closeButtonText: { color: C.text, fontSize: 14, fontWeight: "700" },
  header: {
    alignItems: "center",
    borderBottomColor: C.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  profileView: { flex: 1 },
  screen: { backgroundColor: C.bg, flex: 1 },
  title: { color: C.text, fontSize: 18, fontWeight: "700" },
});
