import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { Search } from "lucide-react";
import * as React from "react";
import { AppShell } from "@/components/app-shell";
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
import {
  useAutmogSettings,
  useCurrencyRates,
  useFiltersOpen,
} from "@/hooks/use-autmog-settings";
import { type AutmogProduct, products } from "@/lib/autmog-data";
import {
  createDefaultMatchModes,
  createEmptyFilters,
  type FilterKey,
  type MatchMode,
  productMatches,
  type SortKey,
  sortProducts,
} from "@/lib/autmog-filters";
import { decodePenParam, penParam } from "@/lib/pen-links";

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

// Browse state is cached at module scope so navigating into a pen route
// (which remounts this page) does not reset the active filters/search/sort.
// The real implementation would keep the grid mounted via a shared layout
// route; this keeps the spike small.
const browseState = {
  query: "",
  sort: "date_desc" as SortKey,
  active: createEmptyFilters(),
  matchModes: createDefaultMatchModes(),
};

export function ArchivePage() {
  const navigate = useNavigate();
  // `/` and `/pen/$penId` both render this page, so the open pen is read from
  // the URL rather than local state — that is what makes each pen shareable.
  const { penId } = useParams({ strict: false });
  const { img } = useSearch({ strict: false }) as { img?: number };

  const { currency, setCurrency, setUnits, setWeight, units, weight } =
    useAutmogSettings();
  const rates = useCurrencyRates();
  const [filtersOpen, setFiltersOpen] = useFiltersOpen();
  const [query, setQuery] = React.useState(browseState.query);
  const [debouncedQuery, setDebouncedQuery] = React.useState(browseState.query);
  const [sort, setSort] = React.useState<SortKey>(browseState.sort);
  const [active, setActive] = React.useState(() => browseState.active);
  const [matchModes, setMatchModes] = React.useState(
    () => browseState.matchModes,
  );
  const searchInputId = React.useId();

  const selectedProduct = React.useMemo<AutmogProduct | null>(
    () => (penId ? decodePenParam(penId) : null),
    [penId],
  );
  const imageIndex = img && img > 1 ? img - 1 : 0;

  React.useEffect(() => {
    browseState.query = query;
  }, [query]);
  React.useEffect(() => {
    browseState.sort = sort;
  }, [sort]);
  React.useEffect(() => {
    browseState.active = active;
  }, [active]);
  React.useEffect(() => {
    browseState.matchModes = matchModes;
  }, [matchModes]);

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
    <AppShell
      headerActions={
        <>
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
            onUnitsChange={setUnits}
            onWeightChange={setWeight}
            units={units}
            weight={weight}
          />
        </>
      }
      meta={`${visibleProducts.length} of ${products.length} items`}
      onSidebarOpenChange={setFiltersOpen}
      sidebarContent={
        <FilterSidebar
          active={active}
          matchModes={matchModes}
          onClear={clearFilters}
          onMatchModeChange={setMatchMode}
          onToggleFilter={toggleFilter}
          products={products}
        />
      }
      sidebarOpen={filtersOpen}
      title="Machined Pen Archive"
    >
      <section className="grid grid-cols-1 gap-[18px] p-3 min-[481px]:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] min-[881px]:grid-cols-[repeat(auto-fill,minmax(max(240px,calc((100%_-_4_*_18px)_/_5)),1fr))] min-[881px]:p-[18px_22px_22px]">
        {visibleProducts.length > 0 ? (
          visibleProducts.map((product) => (
            <ProductCard
              currency={currency}
              key={product.id}
              onOpen={(nextProduct) =>
                navigate({
                  to: "/pen/$penId",
                  params: { penId: penParam(nextProduct) },
                })
              }
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

      <ProductLightbox
        currency={currency}
        imageIndex={imageIndex}
        onClose={() => navigate({ to: "/" })}
        onImageChange={(nextIndex) => {
          if (!selectedProduct) return;
          navigate({
            to: "/pen/$penId",
            params: { penId: penParam(selectedProduct) },
            search: nextIndex > 0 ? { img: nextIndex + 1 } : {},
            replace: true,
          });
        }}
        product={selectedProduct}
        rates={rates}
        units={units}
        weight={weight}
      />
    </AppShell>
  );
}
