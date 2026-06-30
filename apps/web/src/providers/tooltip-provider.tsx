import type * as React from "react";
import { TooltipProvider as UiTooltipProvider } from "@/components/ui/tooltip";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <UiTooltipProvider>{children}</UiTooltipProvider>;
}
