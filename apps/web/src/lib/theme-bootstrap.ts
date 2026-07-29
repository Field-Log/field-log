import type { ThemeMode } from "@/lib/theme";
import type { UserSettingsState } from "@/lib/user-settings";

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
