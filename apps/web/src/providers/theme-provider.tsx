import { loggerMessages } from "@package/logger";
import * as React from "react";
import { logger } from "@/lib/logger";
import {
  applyTheme,
  isThemeMode,
  type ThemeMode,
  themeStorageKey,
} from "@/lib/theme";
import {
  getCurrentUserSettings,
  patchCurrentUserSettings,
} from "@/lib/user-settings";

type ThemeProviderValue = {
  saving: boolean;
  setTheme: (theme: ThemeMode) => void;
  theme: ThemeMode;
};

const ThemeContext = React.createContext<ThemeProviderValue | null>(null);

function readTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";

  const stored = window.localStorage.getItem(themeStorageKey);
  return isThemeMode(stored) ? stored : "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<ThemeMode>(readTheme);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    applyTheme(theme);

    if (theme !== "system") return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  React.useEffect(() => {
    let cancelled = false;

    getCurrentUserSettings()
      .then((settings) => {
        if (cancelled || !settings) return;

        setThemeState(settings.theme);
        window.localStorage.setItem(themeStorageKey, settings.theme);
        applyTheme(settings.theme);
      })
      .catch((error: unknown) => {
        logger.warn(loggerMessages.web.userSettingsFetchFailed, { error });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = React.useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(themeStorageKey, nextTheme);
    applyTheme(nextTheme);

    setSaving(true);
    patchCurrentUserSettings({ data: { theme: nextTheme } })
      .then((settings) => {
        if (!settings) return;

        setThemeState(settings.theme);
        window.localStorage.setItem(themeStorageKey, settings.theme);
        applyTheme(settings.theme);
      })
      .catch((error: unknown) => {
        logger.warn(loggerMessages.web.userSettingsSaveFailed, { error });
      })
      .finally(() => setSaving(false));
  }, []);

  const value = React.useMemo(
    () => ({
      saving,
      setTheme,
      theme,
    }),
    [saving, setTheme, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
