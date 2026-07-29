import type * as React from "react";
import type { UserSettingsState } from "@/lib/user-settings";
import { ClerkProvider } from "./clerk-provider";
import { ThemeProvider } from "./theme-provider";
import { TooltipProvider } from "./tooltip-provider";

export function AppProviders({
  children,
  initialSettingsState,
}: {
  children: React.ReactNode;
  initialSettingsState: UserSettingsState | null;
}) {
  return (
    <ClerkProvider>
      <ThemeProvider initialSettingsState={initialSettingsState}>
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
