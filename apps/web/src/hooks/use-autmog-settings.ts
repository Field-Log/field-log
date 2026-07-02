import * as React from "react";
import {
  baseCurrency,
  type CurrencyCode,
  type CurrencyRates,
  currencies,
  type DimensionUnit,
  todayUTCDateString,
  type WeightUnit,
} from "@/lib/autmog-formatters";

type StoredSettings = {
  units?: DimensionUnit;
  weight?: WeightUnit;
};

const settingsStorageKey = "autmog.settings";
const currencyStorageKey = "autmog.currency";
const filtersClosedStorageKey = "autmog.filtersClosed";
const rateStorageKey = `autmog.fxRates.${baseCurrency}`;

function readStoredSettings(): Required<StoredSettings> {
  if (typeof window === "undefined") return { units: "in", weight: "g" };

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(settingsStorageKey) ?? "{}",
    ) as StoredSettings;

    return {
      units: parsed.units === "mm" ? "mm" : "in",
      weight: parsed.weight === "oz" ? "oz" : "g",
    };
  } catch {
    return { units: "in", weight: "g" };
  }
}

function readCurrency(): CurrencyCode {
  if (typeof window === "undefined") return baseCurrency;
  const stored = window.localStorage.getItem(currencyStorageKey);
  return currencies.includes(stored as CurrencyCode)
    ? (stored as CurrencyCode)
    : baseCurrency;
}

export function useAutmogSettings() {
  const [units, setUnitsState] = React.useState<DimensionUnit>(
    () => readStoredSettings().units,
  );
  const [weight, setWeightState] = React.useState<WeightUnit>(
    () => readStoredSettings().weight,
  );
  const [currency, setCurrencyState] =
    React.useState<CurrencyCode>(readCurrency);

  const setUnits = React.useCallback((nextUnits: DimensionUnit) => {
    setUnitsState(nextUnits);
    const stored = readStoredSettings();
    window.localStorage.setItem(
      settingsStorageKey,
      JSON.stringify({ ...stored, units: nextUnits }),
    );
  }, []);

  const setWeight = React.useCallback((nextWeight: WeightUnit) => {
    setWeightState(nextWeight);
    const stored = readStoredSettings();
    window.localStorage.setItem(
      settingsStorageKey,
      JSON.stringify({ ...stored, weight: nextWeight }),
    );
  }, []);

  const setCurrency = React.useCallback((nextCurrency: CurrencyCode) => {
    setCurrencyState(nextCurrency);
    window.localStorage.setItem(currencyStorageKey, nextCurrency);
  }, []);

  return {
    currency,
    setCurrency,
    setUnits,
    setWeight,
    units,
    weight,
  };
}

export function useCurrencyRates() {
  const [rates, setRates] = React.useState<CurrencyRates>({
    [baseCurrency]: 1,
  });

  React.useEffect(() => {
    let cancelled = false;

    async function loadRates() {
      const today = todayUTCDateString();

      try {
        const cached = JSON.parse(
          window.localStorage.getItem(rateStorageKey) ?? "null",
        ) as { date?: string; rates?: CurrencyRates } | null;

        if (cached?.date === today && cached.rates) {
          setRates({ [baseCurrency]: 1, ...cached.rates });
          return;
        }
      } catch {
        // Ignore malformed cache entries and fetch fresh rates.
      }

      try {
        const symbols = currencies
          .filter((currency) => currency !== baseCurrency)
          .join(",");
        const response = await fetch(
          `https://api.frankfurter.dev/v1/latest?base=${baseCurrency}&symbols=${symbols}`,
          { cache: "no-store" },
        );

        if (!response.ok) throw new Error(`FX ${response.status}`);

        const data = (await response.json()) as { rates?: CurrencyRates };
        if (!cancelled && data.rates) {
          const nextRates = { [baseCurrency]: 1, ...data.rates };
          setRates(nextRates);
          window.localStorage.setItem(
            rateStorageKey,
            JSON.stringify({ date: today, rates: data.rates }),
          );
        }
      } catch (error) {
        console.warn("FX rate fetch failed; using CAD pricing only.", error);
      }
    }

    void loadRates();

    return () => {
      cancelled = true;
    };
  }, []);

  return rates;
}

export function useFiltersOpen() {
  const [filtersOpen, setFiltersOpenState] = React.useState(true);

  React.useEffect(() => {
    const media = window.matchMedia("(max-width: 880px)");
    const sync = () => {
      if (media.matches) {
        setFiltersOpenState(false);
        return;
      }

      setFiltersOpenState(
        window.localStorage.getItem(filtersClosedStorageKey) !== "1",
      );
    };

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const setFiltersOpen = React.useCallback((open: boolean) => {
    setFiltersOpenState(open);

    if (!window.matchMedia("(max-width: 880px)").matches) {
      window.localStorage.setItem(filtersClosedStorageKey, open ? "0" : "1");
    }
  }, []);

  return [filtersOpen, setFiltersOpen] as const;
}
