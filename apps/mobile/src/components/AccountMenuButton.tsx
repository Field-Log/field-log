import { useClerk, useUser } from "@clerk/expo";
import { type BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { type NavigationProp, useNavigation } from "@react-navigation/native";
import { type ReactElement, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import { type MainTabParamList } from "../navigation/types";
import { AccountProfileModal } from "./AccountProfileModal";
import { BetaFeaturesModal } from "./BetaFeaturesModal";
import { UserSettingsModal } from "./UserSettingsModal";

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
  const [settingsOpen, setSettingsOpen] = useState(false);

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
        className={
          tabBarButtonProps
            ? "min-h-12 flex-1 items-center justify-center"
            : "mr-3 h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-sidebar-accent"
        }
        testID={tabBarButtonProps?.testID}
      >
        <View className="h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-sidebar-accent">
          {imageUrl ? (
            <Image className="h-8 w-8" source={{ uri: imageUrl }} />
          ) : (
            <Text className="text-sm font-bold text-foreground">
              {initialsFor(username)}
            </Text>
          )}
        </View>
        {tabBarButtonProps ? (
          <Text className="mt-1 text-xs font-semibold text-muted-foreground">
            Account
          </Text>
        ) : null}
      </Pressable>

      <Modal
        animationType="slide"
        onRequestClose={closeMenu}
        transparent
        visible={menuOpen}
      >
        <View className="flex-1 justify-end bg-black/30">
          <Pressable
            accessibilityLabel="Close account menu"
            onPress={closeMenu}
            className="absolute inset-0"
          />
          <SafeAreaView pointerEvents="box-none" className="flex-1 justify-end">
            <View className="w-full overflow-hidden rounded-t-lg border border-border bg-card pb-2">
              <View className="mb-2 mt-2.5 h-1 w-10 self-center rounded-sm bg-sidebar-border" />
              <View className="flex-row items-center gap-2.5 p-3.5">
                <View className="h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-sidebar-accent">
                  {imageUrl ? (
                    <Image className="h-9 w-9" source={{ uri: imageUrl }} />
                  ) : (
                    <Text className="text-sm font-bold text-foreground">
                      {initialsFor(username)}
                    </Text>
                  )}
                </View>
                <View className="min-w-0 flex-1">
                  <Text
                    className="text-sm font-bold text-card-foreground"
                    numberOfLines={1}
                  >
                    {username}
                  </Text>
                  {email ? (
                    <Text
                      className="mt-0.5 text-xs text-muted-foreground"
                      numberOfLines={1}
                    >
                      {email}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View className="h-px bg-border" />
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
              <MenuItem
                label="Settings"
                onPress={() => {
                  closeMenu();
                  setSettingsOpen(true);
                }}
              />
              <View className="h-px bg-border" />
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
      <UserSettingsModal
        onClose={() => setSettingsOpen(false)}
        visible={settingsOpen}
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
      className="min-h-11 justify-center px-3.5"
    >
      <Text className="text-base font-semibold text-card-foreground">
        {label}
      </Text>
    </Pressable>
  );
}

function initialsFor(value: string | null | undefined): string {
  const first = value?.trim().charAt(0).toUpperCase();
  return first || "U";
}
