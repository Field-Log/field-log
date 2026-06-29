import { PanelLeftClose, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AutmogProduct } from "@/lib/autmog-data";
import {
  type ActiveFilters,
  filterGroups,
  type FilterKey,
  type MatchMode,
  type MatchModes,
  valuesFor,
} from "@/lib/autmog-filters";
import { cn } from "@/lib/utils";

type FilterSidebarProps = {
  active: ActiveFilters;
  filtersOpen: boolean;
  matchModes: MatchModes;
  onClear: () => void;
  onMatchModeChange: (key: FilterKey, mode: MatchMode) => void;
  onOpenChange: (open: boolean) => void;
  onToggleFilter: (key: FilterKey, value: string) => void;
  products: AutmogProduct[];
};

export function FilterSidebar({
  active,
  filtersOpen,
  matchModes,
  onClear,
  onMatchModeChange,
  onOpenChange,
  onToggleFilter,
  products,
}: FilterSidebarProps) {
  return (
    <>
      <button
        aria-hidden={!filtersOpen}
        className={cn(
          "fixed inset-0 z-20 bg-black/60 transition-opacity min-[881px]:hidden",
          filtersOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => onOpenChange(false)}
        type="button"
      />
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-[min(86vw,320px)] overflow-y-auto border-r border-sidebar-border bg-sidebar px-4 pt-12 pb-4 text-sidebar-foreground shadow-2xl transition duration-300 ease-[cubic-bezier(0.22,0.65,0.27,1)] scrollbar-none min-[881px]:sticky min-[881px]:top-[70px] min-[881px]:z-auto min-[881px]:max-h-[calc(100vh-90px)] min-[881px]:w-auto min-[881px]:translate-x-0 min-[881px]:rounded-lg min-[881px]:border min-[881px]:pt-4 min-[881px]:shadow-none",
          filtersOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0 min-[881px]:pointer-events-none min-[881px]:-translate-x-full",
        )}
      >
        <Button
          aria-label="Close filters"
          className="absolute top-3 right-3"
          onClick={() => onOpenChange(false)}
          size="icon"
          type="button"
          variant="outline"
        >
          <PanelLeftClose />
        </Button>

        {filterGroups.map((group) => (
          <section key={group.key} className="mt-5 first:mt-0">
            <div className="mb-2 flex min-h-[26px] items-center justify-between gap-2 border-b border-sidebar-border pb-1.5">
              <h2 className="text-[12.5px] font-bold tracking-[1.2px] uppercase">
                {group.label}
              </h2>
              {group.andable ? (
                <ToggleGroup
                  aria-label={`${group.label} match mode`}
                  className={cn(
                    "h-[25px] w-auto gap-0 p-0.5",
                    active[group.key].size < 2 && "invisible",
                  )}
                  onValueChange={(value) => {
                    if (value) onMatchModeChange(group.key, value as MatchMode);
                  }}
                  type="single"
                  value={matchModes[group.key]}
                >
                  <ToggleGroupItem className="h-5 px-2 text-[10px]" value="any">
                    any
                  </ToggleGroupItem>
                  <ToggleGroupItem className="h-5 px-2 text-[10px]" value="all">
                    all
                  </ToggleGroupItem>
                </ToggleGroup>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1">
              {valuesFor(products, group.key).map(([value, count]) => {
                const selected = active[group.key].has(value);
                return (
                  <button
                    className={cn(
                      "rounded-full border border-transparent px-2 py-1 text-[11.5px] whitespace-nowrap transition-colors hover:border-primary",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                    key={value}
                    onClick={() => onToggleFilter(group.key, value)}
                    type="button"
                  >
                    {value}
                    <span className="ml-1 opacity-65">{count}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        <Button className="mt-4 w-full" onClick={onClear} variant="outline">
          Clear all filters
        </Button>
      </aside>

      {!filtersOpen ? (
        <button
          aria-label="Open filters"
          className="fixed top-1/2 left-0 z-30 inline-flex -translate-y-1/2 items-center gap-1 rounded-r-lg border border-l-0 border-sidebar-border bg-sidebar px-2 py-5 text-xs font-semibold tracking-[1px] text-sidebar-foreground uppercase [writing-mode:vertical-rl] hover:text-primary"
          onClick={() => onOpenChange(true)}
          type="button"
        >
          <SlidersHorizontal className="size-4 [writing-mode:horizontal-tb]" />
          Filters
        </button>
      ) : null}
    </>
  );
}
