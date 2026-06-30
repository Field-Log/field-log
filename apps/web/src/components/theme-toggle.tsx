import { Monitor, Moon, Sun } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ThemeMode } from "@/lib/theme";
import { useTheme } from "@/providers/theme-provider";

const themeOptions: Array<{
  icon: typeof Sun;
  label: string;
  value: ThemeMode;
}> = [
  { icon: Sun, label: "Light", value: "light" },
  { icon: Monitor, label: "System", value: "system" },
  { icon: Moon, label: "Dark", value: "dark" },
];

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <ToggleGroup
      aria-label="Theme"
      className="w-full"
      onValueChange={(value) => {
        if (value) setTheme(value as ThemeMode);
      }}
      type="single"
      value={theme}
    >
      {themeOptions.map((option) => {
        const Icon = option.icon;

        return (
          <Tooltip key={option.value}>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                aria-label={option.label}
                className="h-8 px-0"
                value={option.value}
              >
                <Icon />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="top">{option.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </ToggleGroup>
  );
}
