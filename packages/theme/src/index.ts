export const nativeLightColors = {
  background: "#FFFFFF",
  foreground: "#0A0A0A",
  card: "#FFFFFF",
  cardForeground: "#0A0A0A",
  popover: "#FFFFFF",
  popoverForeground: "#0A0A0A",
  primary: "#171717",
  primaryForeground: "#FAFAFA",
  secondary: "#F5F5F5",
  secondaryForeground: "#171717",
  muted: "#F5F5F5",
  mutedForeground: "#737373",
  accent: "#F5F5F5",
  accentForeground: "#171717",
  destructive: "#E7000B",
  border: "#E5E5E5",
  input: "#E5E5E5",
  ring: "#A1A1A1",
  chart1: "#F54900",
  chart2: "#009689",
  chart3: "#104E64",
  chart4: "#FFB900",
  chart5: "#FE9A00",
  sidebar: "#FAFAFA",
  sidebarForeground: "#0A0A0A",
  sidebarPrimary: "#171717",
  sidebarPrimaryForeground: "#FAFAFA",
  sidebarAccent: "#F5F5F5",
  sidebarAccentForeground: "#171717",
  sidebarBorder: "#E5E5E5",
  sidebarRing: "#A1A1A1",
} as const;

export const nativeDarkColors = {
  background: "#000000",
  foreground: "#D1C5C0",
  card: "#000000",
  cardForeground: "#FFFFFF",
  popover: "#000000",
  popoverForeground: "#FFFFFF",
  primary: "#FCEC0A",
  primaryForeground: "#000000",
  secondary: "#696969",
  secondaryForeground: "#FFFFFF",
  muted: "#000000",
  mutedForeground: "#FFFFFF",
  accent: "#2B2A5C",
  accentForeground: "#FFFFFF",
  destructive: "#AB5797",
  border: "rgba(255, 255, 255, 0.06)",
  input: "#000000",
  ring: "#FCEC0A",
  chart1: "#146377",
  chart2: "#33D057",
  chart3: "#FCEC0A",
  chart4: "#AB5797",
  chart5: "#FF023C",
  sidebar: "#000000",
  sidebarForeground: "#FFFFFF",
  sidebarPrimary: "#FCEC0A",
  sidebarPrimaryForeground: "#000000",
  sidebarAccent: "rgba(255, 255, 255, 0.06)",
  sidebarAccentForeground: "#FFFFFF",
  sidebarBorder: "#636363",
  sidebarRing: "#2B2A5C",
} as const;

export const nativeTheme = {
  light: nativeLightColors,
  dark: nativeDarkColors,
} as const;

export const nativeNavigationTheme = {
  dark: true,
  colors: {
    background: nativeDarkColors.background,
    border: nativeDarkColors.border,
    card: nativeDarkColors.card,
    notification: nativeDarkColors.destructive,
    primary: nativeDarkColors.primary,
    text: nativeDarkColors.foreground,
  },
} as const;

export const nativeStatusBar = {
  backgroundColor: nativeDarkColors.background,
  style: "light" as const,
} as const;

export const nativePlaceholders = {
  textInput: nativeDarkColors.mutedForeground,
} as const;

export const nativeIndicators = {
  activity: nativeDarkColors.primary,
} as const;

export type NativeThemeColor = keyof typeof nativeLightColors;
