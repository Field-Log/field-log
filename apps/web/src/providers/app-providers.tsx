import type * as React from "react";
import { ClerkProvider } from "./clerk-provider";
import { ThemeProvider } from "./theme-provider";
import { TooltipProvider } from "./tooltip-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
