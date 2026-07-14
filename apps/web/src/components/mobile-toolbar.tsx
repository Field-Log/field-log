import { ArrowUpDown, Check, Settings, SlidersHorizontal } from "lucide-react";
import * as React from "react";
import { FilterSidebar } from "@/components/filter-sidebar";
import { SettingsPanel } from "@/components/settings-drawer";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { AutmogProduct } from "@/lib/autmog-data";
import type {
  ActiveFilters,
  FilterKey,
  MatchMode,
  MatchModes,
  SortKey,
} from "@/lib/autmog-filters";
import type {
  CurrencyCode,
  DimensionUnit,
  WeightUnit,
} from "@/lib/autmog-formatters";
import { cn } from "@/lib/utils";

// Height of the bar itself (excludes the safe-area padding below it). Kept in
// sync with the reserved bottom padding in `app-shell.tsx`.
const BAR_HEIGHT = "3.5rem";

type MobileToolbarProps = {
  active: ActiveFilters;
  currency: CurrencyCode;
  filterCount: number;
  matchModes: MatchModes;
  onClearFilters: () => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onMatchModeChange: (key: FilterKey, mode: MatchMode) => void;
  onSortChange: (sort: SortKey) => void;
  onToggleFilter: (key: FilterKey, value: string) => void;
  onUnitsChange: (unit: DimensionUnit) => void;
  onWeightChange: (unit: WeightUnit) => void;
  products: AutmogProduct[];
  sort: SortKey;
  sortOptions: Array<{ label: string; value: SortKey }>;
  units: DimensionUnit;
  weight: WeightUnit;
};

/**
 * Compact-only (`< md`) bottom toolbar. It is a toolbar, not a nav bar: each
 * item opens a bottom sheet rather than switching screens. Filters / Sort /
 * Settings are vaul bottom sheets (swipe-to-dismiss). Search deliberately lives
 * in the sticky top header (its own full-width row on compact) rather than
 * here, so the field never has to dock to the on-screen keyboard — the pattern
 * that fought iOS Safari's viewport. Hidden at `md` and up, where the
 * persistent sidebar and header controls take over.
 */
export function MobileToolbar({
  active,
  currency,
  filterCount,
  matchModes,
  onClearFilters,
  onCurrencyChange,
  onMatchModeChange,
  onSortChange,
  onToggleFilter,
  onUnitsChange,
  onWeightChange,
  products,
  sort,
  sortOptions,
  units,
  weight,
}: MobileToolbarProps) {
  const [sortOpen, setSortOpen] = React.useState(false);

  return (
    <div className="md:hidden">
      <nav
        aria-label="Archive controls"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
        style={{ height: `calc(${BAR_HEIGHT} + env(safe-area-inset-bottom))` }}
      >
        <Drawer>
          <DrawerTrigger asChild>
            <ToolbarButton
              active={filterCount > 0}
              badge={filterCount}
              icon={SlidersHorizontal}
              label="Filters"
            />
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filters</DrawerTitle>
              <DrawerDescription className="sr-only">
                Filter the archive by category, size, material, and more.
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto px-2 pb-4">
              <FilterSidebar
                active={active}
                matchModes={matchModes}
                onClear={onClearFilters}
                onMatchModeChange={onMatchModeChange}
                onToggleFilter={onToggleFilter}
                products={products}
              />
            </div>
          </DrawerContent>
        </Drawer>

        <Drawer onOpenChange={setSortOpen} open={sortOpen}>
          <DrawerTrigger asChild>
            <ToolbarButton icon={ArrowUpDown} label="Sort" />
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Sort</DrawerTitle>
              <DrawerDescription className="sr-only">
                Choose how the archive is ordered.
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto p-2">
              {sortOptions.map((option) => {
                const selected = option.value === sort;
                return (
                  <button
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                      selected && "font-semibold text-foreground",
                    )}
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value);
                      setSortOpen(false);
                    }}
                    type="button"
                  >
                    {option.label}
                    {selected ? <Check className="size-4" /> : null}
                  </button>
                );
              })}
            </div>
          </DrawerContent>
        </Drawer>

        <Drawer>
          <DrawerTrigger asChild>
            <ToolbarButton icon={Settings} label="Settings" />
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Settings</DrawerTitle>
              <DrawerDescription className="sr-only">
                Display preferences for the archive.
              </DrawerDescription>
            </DrawerHeader>
            <SettingsPanel
              currency={currency}
              onCurrencyChange={onCurrencyChange}
              onUnitsChange={onUnitsChange}
              onWeightChange={onWeightChange}
              showTheme
              units={units}
              weight={weight}
            />
          </DrawerContent>
        </Drawer>
      </nav>
    </div>
  );
}

type ToolbarButtonProps = React.ComponentProps<"button"> & {
  active?: boolean;
  badge?: number;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
};

const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ active, badge, className, icon: Icon, label, ...props }, ref) => (
    <button
      className={cn(
        "relative flex h-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium tracking-[0.2px] transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
        className,
      )}
      ref={ref}
      type="button"
      {...props}
    >
      <span className="relative">
        <Icon className="size-5" />
        {badge && badge > 0 ? (
          <span className="absolute -top-1.5 -right-2.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] leading-4 font-bold text-primary-foreground">
            {badge}
          </span>
        ) : null}
      </span>
      {label}
    </button>
  ),
);
ToolbarButton.displayName = "ToolbarButton";
