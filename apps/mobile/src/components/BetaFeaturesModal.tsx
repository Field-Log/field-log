import { useAuth } from "@clerk/expo";
import { loggerMessages } from "@package/logger";
import { type ReactElement, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  fetchBetaFeatureFlags,
  type MobileBetaFeatureFlag,
  setBetaFeatureFlag,
} from "../lib/feature-flags";
import { logger } from "../lib/logger";
import { C } from "../theme/colors";

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
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Beta features</Text>
          <Pressable
            accessibilityLabel="Close beta features"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>X</Text>
          </Pressable>
        </View>
        <View style={styles.content}>
          {loading ? <ActivityIndicator /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!loading && flags.length === 0 ? (
            <Text style={styles.empty}>No beta features are available.</Text>
          ) : null}
          {flags.map((flag) => (
            <View key={flag.slug} style={styles.flagRow}>
              <View style={styles.flagCopy}>
                <Text style={styles.flagName}>{flag.name}</Text>
                <Text style={styles.flagSlug}>{flag.slug}</Text>
                {flag.description ? (
                  <Text style={styles.flagDescription}>{flag.description}</Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  toggleFlag(flag);
                }}
                style={[
                  styles.toggleButton,
                  flag.enabled ? styles.toggleButtonOn : null,
                ]}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    flag.enabled ? styles.toggleButtonTextOn : null,
                  ]}
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
  content: {
    gap: 10,
    padding: 16,
  },
  empty: {
    color: C.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: C.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  flagCopy: {
    flex: 1,
    minWidth: 0,
  },
  flagDescription: {
    color: C.textSub,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  flagName: {
    color: C.text,
    fontSize: 15,
    fontWeight: "700",
  },
  flagRow: {
    alignItems: "center",
    backgroundColor: C.bgCard,
    borderColor: C.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  flagSlug: {
    color: C.textMuted,
    fontFamily: "monospace",
    fontSize: 12,
    marginTop: 2,
  },
  header: {
    alignItems: "center",
    borderBottomColor: C.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  screen: { backgroundColor: C.bg, flex: 1 },
  title: { color: C.text, fontSize: 18, fontWeight: "700" },
  toggleButton: {
    alignItems: "center",
    borderColor: C.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
    minWidth: 86,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggleButtonOn: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  toggleButtonText: {
    color: C.textSub,
    fontSize: 13,
    fontWeight: "700",
  },
  toggleButtonTextOn: {
    color: C.text,
  },
});
