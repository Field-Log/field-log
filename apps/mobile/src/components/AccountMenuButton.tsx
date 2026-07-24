import { useClerk, useUser } from "@clerk/expo";
import { type BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { type NavigationProp, useNavigation } from "@react-navigation/native";
import { type ReactElement, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { type MainTabParamList } from "../navigation/types";
import { C } from "../theme/colors";
import { AccountProfileModal } from "./AccountProfileModal";
import { BetaFeaturesModal } from "./BetaFeaturesModal";

type AccountMenuButtonProps = {
  tabBarButtonProps?: BottomTabBarButtonProps;
};

export function AccountMenuButton({
  tabBarButtonProps,
}: AccountMenuButtonProps): ReactElement {
  const clerk = useClerk();
  const { user: clerkUser } = useUser();
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [betaFeaturesOpen, setBetaFeaturesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const username = clerkUser?.username ?? clerkUser?.fullName ?? "User";
  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  const imageUrl = clerkUser?.imageUrl;

  function closeMenu(): void {
    setMenuOpen(false);
  }

  async function handleSignOut(): Promise<void> {
    closeMenu();
    await clerk.signOut();
  }

  return (
    <>
      <Pressable
        accessibilityLabel="Account menu"
        accessibilityRole="button"
        accessibilityState={tabBarButtonProps?.accessibilityState}
        disabled={tabBarButtonProps?.disabled}
        hitSlop={8}
        onPress={() => setMenuOpen(true)}
        onLongPress={tabBarButtonProps?.onLongPress}
        style={tabBarButtonProps ? styles.tabTrigger : styles.headerTrigger}
        testID={tabBarButtonProps?.testID}
      >
        <View style={styles.triggerAvatar}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarFallback}>{initialsFor(username)}</Text>
          )}
        </View>
        {tabBarButtonProps ? (
          <Text style={styles.tabLabel}>Account</Text>
        ) : null}
      </Pressable>

      <Modal
        animationType="slide"
        onRequestClose={closeMenu}
        transparent
        visible={menuOpen}
      >
        <View style={styles.menuOverlay}>
          <Pressable
            accessibilityLabel="Close account menu"
            onPress={closeMenu}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView pointerEvents="box-none" style={styles.menuSafeArea}>
            <View style={styles.menuPanel}>
              <View style={styles.sheetHandle} />
              <View style={styles.menuLabel}>
                <View style={styles.menuAvatar}>
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.menuAvatarImage}
                    />
                  ) : (
                    <Text style={styles.menuAvatarFallback}>
                      {initialsFor(username)}
                    </Text>
                  )}
                </View>
                <View style={styles.menuIdentity}>
                  <Text numberOfLines={1} style={styles.menuName}>
                    {username}
                  </Text>
                  {email ? (
                    <Text numberOfLines={1} style={styles.menuEmail}>
                      {email}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.separator} />
              <MenuItem
                label="Account"
                onPress={() => {
                  closeMenu();
                  setProfileOpen(true);
                }}
              />
              <MenuItem
                label="Collections"
                onPress={() => {
                  closeMenu();
                  navigation.navigate("Collections");
                }}
              />
              <MenuItem
                label="Beta features"
                onPress={() => {
                  closeMenu();
                  setBetaFeaturesOpen(true);
                }}
              />
              <View style={styles.separator} />
              <MenuItem label="Sign out" onPress={handleSignOut} />
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      <AccountProfileModal
        onClose={() => setProfileOpen(false)}
        visible={profileOpen}
      />
      <BetaFeaturesModal
        onClose={() => setBetaFeaturesOpen(false)}
        visible={betaFeaturesOpen}
      />
    </>
  );
}

function MenuItem({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void | Promise<void>;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.menuItem}
    >
      <Text style={styles.menuItemText}>{label}</Text>
    </Pressable>
  );
}

function initialsFor(value: string | null | undefined): string {
  const first = value?.trim().charAt(0).toUpperCase();
  return first || "U";
}

const styles = StyleSheet.create({
  avatarFallback: { color: C.text, fontSize: 13, fontWeight: "700" },
  avatarImage: { height: 32, width: 32 },
  menuAvatar: {
    alignItems: "center",
    backgroundColor: C.bgMuted,
    borderColor: C.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    overflow: "hidden",
    width: 36,
  },
  menuAvatarFallback: { color: C.text, fontSize: 13, fontWeight: "700" },
  menuAvatarImage: { height: 36, width: 36 },
  menuEmail: { color: C.textMuted, fontSize: 12, marginTop: 2 },
  menuIdentity: { flex: 1, minWidth: 0 },
  menuItem: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  menuItemText: { color: C.text, fontSize: 15, fontWeight: "600" },
  menuLabel: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  menuName: { color: C.text, fontSize: 14, fontWeight: "700" },
  menuOverlay: {
    backgroundColor: "rgba(0,0,0,0.28)",
    flex: 1,
    justifyContent: "flex-end",
  },
  menuPanel: {
    backgroundColor: C.bgCard,
    borderColor: C.border,
    borderWidth: 1,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: "hidden",
    paddingBottom: 8,
    width: "100%",
  },
  menuSafeArea: { flex: 1, justifyContent: "flex-end" },
  separator: { backgroundColor: C.border, height: StyleSheet.hairlineWidth },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: C.borderStrong,
    borderRadius: 2,
    height: 4,
    marginBottom: 8,
    marginTop: 10,
    width: 42,
  },
  headerTrigger: {
    alignItems: "center",
    backgroundColor: C.bgMuted,
    borderColor: C.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
    width: 36,
  },
  tabLabel: {
    color: C.textMuted,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
  },
  tabTrigger: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  triggerAvatar: {
    alignItems: "center",
    backgroundColor: C.bgMuted,
    borderColor: C.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    overflow: "hidden",
    width: 32,
  },
});
