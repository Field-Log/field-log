import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { FilterSidebar } from "@/components/filter-sidebar";
import { ProductCard } from "@/components/product-card";
import { ProductLightbox } from "@/components/product-lightbox";
import { SettingsDrawer } from "@/components/settings-drawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  useAutmogSettings,
  useCurrencyRates,
  useFiltersOpen,
} from "@/hooks/use-autmog-settings";
import { products, type AutmogProduct } from "@/lib/autmog-data";
import {
  type FilterKey,
  createDefaultMatchModes,
  createEmptyFilters,
  type MatchMode,
  productMatches,
  type SortKey,
  sortProducts,
} from "@/lib/autmog-filters";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Home,
});

const sortOptions: Array<{ label: string; value: SortKey }> = [
  { label: "Newest drop", value: "date_desc" },
  { label: "Oldest drop", value: "date_asc" },
  { label: "Price low to high", value: "price_asc" },
  { label: "Price high to low", value: "price_desc" },
  { label: "Weight light to heavy", value: "weight_asc" },
  { label: "Weight heavy to light", value: "weight_desc" },
  { label: "Diameter thin to thick", value: "diameter_asc" },
  { label: "Diameter thick to thin", value: "diameter_desc" },
  { label: "Title A to Z", value: "title_asc" },
];

function Home() {
  const {
    currency,
    setCurrency,
    setTheme,
    setUnits,
    setWeight,
    theme,
    units,
    weight,
  } = useAutmogSettings();
  const rates = useCurrencyRates();
  const [filtersOpen, setFiltersOpen] = useFiltersOpen();
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("date_desc");
  const [active, setActive] = React.useState(createEmptyFilters);
  const [matchModes, setMatchModes] = React.useState(createDefaultMatchModes);
  const [selectedProduct, setSelectedProduct] =
    React.useState<AutmogProduct | null>(null);
  const searchInputId = React.useId();

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 150);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const visibleProducts = React.useMemo(() => {
    const filtered = products.filter((product) =>
      productMatches(product, debouncedQuery, active, matchModes),
    );
    return sortProducts(filtered, sort);
  }, [active, debouncedQuery, matchModes, sort]);

  const toggleFilter = React.useCallback((key: FilterKey, value: string) => {
    setActive((current) => {
      const nextValues = new Set(current[key]);
      if (nextValues.has(value)) nextValues.delete(value);
      else nextValues.add(value);

      return {
        ...current,
        [key]: nextValues,
      };
    });
  }, []);

  const setMatchMode = React.useCallback((key: FilterKey, mode: MatchMode) => {
    setMatchModes((current) => ({
      ...current,
      [key]: mode,
    }));
  }, []);

  const clearFilters = React.useCallback(() => {
    setActive(createEmptyFilters());
    setMatchModes(createDefaultMatchModes());
    setQuery("");
  }, []);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-background/90 px-3.5 py-2.5 backdrop-blur min-[881px]:px-5 min-[881px]:py-3.5">
          <h1 className="m-0 text-[16px] font-bold tracking-[0.5px] min-[881px]:text-lg">
            Machined Pen Archive
          </h1>
          <span className="text-xs text-muted-foreground min-[881px]:text-sm">
            {visibleProducts.length} of {products.length} items
          </span>
          <div className="hidden flex-1 min-[881px]:block" />
          <label
            className="relative order-99 w-full min-[881px]:order-none min-[881px]:w-[260px]"
            htmlFor={searchInputId}
          >
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search pens by title, specs, or description"
              autoComplete="off"
              className="pr-3 pl-9"
              id={searchInputId}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search..."
              type="search"
              value={query}
            />
          </label>
          <Select
            onValueChange={(value) => setSort(value as SortKey)}
            value={sort}
          >
            <SelectTrigger aria-label="Sort pens" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SettingsDrawer
            currency={currency}
            onCurrencyChange={setCurrency}
            onThemeChange={setTheme}
            onUnitsChange={setUnits}
            onWeightChange={setWeight}
            theme={theme}
            units={units}
            weight={weight}
          />
        </header>

        <main
          className={cn(
            "grid grid-cols-1 items-start gap-0 p-3 transition-[grid-template-columns,gap] duration-300 ease-[cubic-bezier(0.22,0.65,0.27,1)] min-[881px]:p-[18px_22px_22px]",
            filtersOpen
              ? "min-[881px]:grid-cols-[290px_1fr] min-[881px]:gap-5"
              : "min-[881px]:grid-cols-[0_1fr] min-[881px]:gap-0",
          )}
        >
          <FilterSidebar
            active={active}
            filtersOpen={filtersOpen}
            matchModes={matchModes}
            onClear={clearFilters}
            onMatchModeChange={setMatchMode}
            onOpenChange={setFiltersOpen}
            onToggleFilter={toggleFilter}
            products={products}
          />

          <section className="grid grid-cols-1 gap-[18px] min-[481px]:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] min-[881px]:grid-cols-[repeat(auto-fill,minmax(max(240px,calc((100%_-_4_*_18px)_/_5)),1fr))]">
            {visibleProducts.length > 0 ? (
              visibleProducts.map((product) => (
                <ProductCard
                  currency={currency}
                  key={product.id}
                  onOpen={(nextProduct) => setSelectedProduct(nextProduct)}
                  product={product}
                  rates={rates}
                  units={units}
                  weight={weight}
                />
              ))
            ) : (
              <div className="col-span-full rounded-lg border border-dashed border-border p-16 text-center text-muted-foreground">
                No items match these filters.
              </div>
            )}
          </section>
        </main>

        <footer className="mx-auto mt-9 mb-7 max-w-[720px] border-t border-border px-6 pt-4 text-center text-[12.5px] leading-7 text-muted-foreground">
          <div>
            A resource for{" "}
            <a
              className="text-primary underline underline-offset-2"
              href="https://www.reddit.com/r/machinedpens/"
              rel="noopener"
              target="_blank"
            >
              r/machinedpens
            </a>{" "}
            and the Machined Pens Discord.
          </div>
          <div>
            Suggestions or contact:{" "}
            <a
              className="text-primary underline underline-offset-2"
              href="https://www.reddit.com/user/BVG_Digital/"
              rel="noopener"
              target="_blank"
            >
              u/BVG_Digital
            </a>
          </div>
          <div className="mx-auto mt-3 max-w-[640px] border-t border-border pt-3 text-[11.5px] leading-5 opacity-70">
            Product names, images, and descriptions remain the property of their
            respective owners. Made by a fan; not affiliated with any maker.
          </div>
        </footer>

        <ProductLightbox
          currency={currency}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
          rates={rates}
          units={units}
          weight={weight}
        />
      </div>
    </TooltipProvider>
  );
}
