import { UserProfileView } from "@clerk/expo/native";
import { styled } from "nativewind";
import { type ReactElement } from "react";
import { Modal, Pressable, SafeAreaView, Text, View } from "react-native";

const StyledUserProfileView = styled(UserProfileView);

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
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Text className="text-lg font-bold text-foreground">Account</Text>
          <Pressable
            accessibilityLabel="Close account"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            className="h-9 w-9 items-center justify-center rounded-lg border border-border bg-sidebar-accent"
          >
            <Text className="text-sm font-bold text-foreground">X</Text>
          </Pressable>
        </View>
        <StyledUserProfileView
          isDismissible={false}
          onDismiss={onClose}
          className="flex-1"
        />
      </SafeAreaView>
    </Modal>
  );
}
