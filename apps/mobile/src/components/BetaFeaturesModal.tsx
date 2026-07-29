import { useAuth } from "@clerk/expo";
import { loggerMessages } from "@package/logger";
import { type ReactElement, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import {
  fetchBetaFeatureFlags,
  type MobileBetaFeatureFlag,
  setBetaFeatureFlag,
} from "../lib/feature-flags";
import { logger } from "../lib/logger";

type BetaFeaturesModalProps = {
  onClose: () => void;
  visible: boolean;
};

export function BetaFeaturesModal({
  onClose,
  visible,
}: BetaFeaturesModalProps): ReactElement {
  const { getToken } = useAuth();
  const [flags, setFlags] = useState<MobileBetaFeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFlags = useCallback(async () => {
    if (!visible) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Missing session token.");
      }

      setFlags(await fetchBetaFeatureFlags(token));
    } catch (loadError: unknown) {
      logger.warn(loggerMessages.mobile.featureFlagsFetchFailed, {
        error: loadError,
      });
      setError("Beta features are unavailable.");
    } finally {
      setLoading(false);
    }
  }, [getToken, visible]);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  async function toggleFlag(flag: MobileBetaFeatureFlag): Promise<void> {
    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Missing session token.");
      }

      await setBetaFeatureFlag({
        enabled: !flag.enabled,
        slug: flag.slug,
        token,
      });
      await loadFlags();
    } catch (toggleError: unknown) {
      logger.warn(loggerMessages.mobile.featureFlagsFetchFailed, {
        error: toggleError,
      });
      setError("Could not update beta feature.");
    }
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Text className="text-lg font-bold text-foreground">
            Beta features
          </Text>
          <Pressable
            accessibilityLabel="Close beta features"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            className="h-9 w-9 items-center justify-center rounded-lg border border-border bg-sidebar-accent"
          >
            <Text className="text-sm font-bold text-foreground">X</Text>
          </Pressable>
        </View>
        <View className="gap-2.5 p-4">
          {loading ? <ActivityIndicator /> : null}
          {error ? (
            <Text className="text-sm leading-5 text-destructive">{error}</Text>
          ) : null}
          {!loading && flags.length === 0 ? (
            <Text className="text-sm leading-5 text-muted-foreground">
              No beta features are available.
            </Text>
          ) : null}
          {flags.map((flag) => (
            <View
              key={flag.slug}
              className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <View className="min-w-0 flex-1">
                <Text className="text-base font-bold text-card-foreground">
                  {flag.name}
                </Text>
                <Text className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {flag.slug}
                </Text>
                {flag.description ? (
                  <Text className="mt-1 text-sm leading-5 text-card-foreground">
                    {flag.description}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  toggleFlag(flag);
                }}
                className={`min-h-9 min-w-20 items-center rounded-lg border px-3 py-2 ${
                  flag.enabled
                    ? "border-accent bg-accent"
                    : "border-border bg-background"
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    flag.enabled
                      ? "text-accent-foreground"
                      : "text-card-foreground"
                  }`}
                >
                  {flag.enabled ? "Enabled" : "Disabled"}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
