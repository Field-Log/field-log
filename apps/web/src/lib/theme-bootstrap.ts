import type { ThemeMode } from "@/lib/theme";
import type { UserSettingsState } from "@/lib/user-settings";

export type ThemeBootstrapState = {
  serverTheme: ThemeMode | null;
  shouldUseServerTheme: boolean;
};

export function resolveThemeBootstrap(
  settingsState: UserSettingsState,
  localTheme: ThemeMode | null,
) {
  if (settingsState.hasSavedSettings) {
    return {
      shouldPersist: false,
      theme: settingsState.settings.theme,
    };
  }

  return {
    shouldPersist: Boolean(localTheme),
    theme: localTheme ?? settingsState.settings.theme,
  };
}

export function resolveServerThemeBootstrap(
  settingsState: UserSettingsState | null,
): ThemeBootstrapState {
  if (!settingsState?.hasSavedSettings) {
    return {
      serverTheme: null,
      shouldUseServerTheme: false,
    };
  }

  return {
    serverTheme: settingsState.settings.theme,
    shouldUseServerTheme: true,
  };
}
