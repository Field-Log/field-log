import { loggerMessages } from "@package/logger";
import * as React from "react";
import { compactMediaQuery } from "@/lib/breakpoints";
import { logger } from "@/lib/logger";
import {
  baseCurrency,
  type CurrencyCode,
  type CurrencyRates,
  currencies,
  type DimensionUnit,
  todayUTCDateString,
  type WeightUnit,
} from "@/lib/pen-formatters";
import {
  defaultUserSettings,
  getCurrentUserSettings,
  patchCurrentUserSettings,
  type UserSettingsPatch,
} from "@/lib/user-settings";

const filtersClosedStorageKey = "field-log.filtersClosed";
const rateStorageKey = `field-log.fxRates.${baseCurrency}`;

export function usePenSettings() {
  const [units, setUnitsState] = React.useState<DimensionUnit>(
    defaultUserSettings.dimensionUnit,
  );
  const [weight, setWeightState] = React.useState<WeightUnit>(
    defaultUserSettings.weightUnit,
  );
  const [currency, setCurrencyState] = React.useState<CurrencyCode>(
    defaultUserSettings.currencyCode,
  );
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    getCurrentUserSettings()
      .then((settings) => {
        if (cancelled || !settings) return;

        setUnitsState(settings.dimensionUnit);
        setWeightState(settings.weightUnit);
        setCurrencyState(settings.currencyCode);
      })
      .catch((error: unknown) => {
        logger.warn(loggerMessages.web.userSettingsFetchFailed, { error });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const saveSettings = React.useCallback((patch: UserSettingsPatch) => {
    setSaving(true);
    patchCurrentUserSettings({ data: patch })
      .then((settings) => {
        if (!settings) return;

        setUnitsState(settings.dimensionUnit);
        setWeightState(settings.weightUnit);
        setCurrencyState(settings.currencyCode);
      })
      .catch((error: unknown) => {
        logger.warn(loggerMessages.web.userSettingsSaveFailed, { error });
      })
      .finally(() => setSaving(false));
  }, []);

  const setUnits = React.useCallback(
    (nextUnits: DimensionUnit) => {
      setUnitsState(nextUnits);
      saveSettings({ dimensionUnit: nextUnits });
    },
    [saveSettings],
  );

  const setWeight = React.useCallback(
    (nextWeight: WeightUnit) => {
      setWeightState(nextWeight);
      saveSettings({ weightUnit: nextWeight });
    },
    [saveSettings],
  );

  const setCurrency = React.useCallback(
    (nextCurrency: CurrencyCode) => {
      setCurrencyState(nextCurrency);
      saveSettings({ currencyCode: nextCurrency });
    },
    [saveSettings],
  );

  return {
    currency,
    setCurrency,
    setUnits,
    setWeight,
    saving,
    units,
    weight,
  };
}

export function useCurrencyRates() {
  const [rates, setRates] = React.useState<CurrencyRates>({
    [baseCurrency]: 1,
  });

  // `force` skips the once-a-day cache so pull-to-refresh always re-hits the FX
  // API; the normal mount path still short-circuits on a same-day cache hit.
  const loadRates = React.useCallback(async (force = false) => {
    const today = todayUTCDateString();

    if (!force) {
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

      const symbols = currencies
        .filter((currency) => currency !== baseCurrency)
        .join(",");

      try {
        const response = await fetch(
          `https://api.frankfurter.dev/v1/latest?base=${baseCurrency}&symbols=${symbols}`,
          { cache: "no-store" },
        );

        if (!response.ok) throw new Error(`FX ${response.status}`);

        const data = (await response.json()) as { rates?: CurrencyRates };
        if (data.rates) {
          const nextRates = { [baseCurrency]: 1, ...data.rates };
          setRates(nextRates);
          window.localStorage.setItem(
            rateStorageKey,
            JSON.stringify({ date: today, rates: data.rates }),
          );
        }
      } catch (error) {
        logger.warn(loggerMessages.web.fxRatesFetchFailed, {
          attributes: {
            baseCurrency,
            symbols,
          },
          error,
        });
      }
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
      if (data.rates) {
        setRates({ [baseCurrency]: 1, ...data.rates });
        window.localStorage.setItem(
          rateStorageKey,
          JSON.stringify({ date: today, rates: data.rates }),
        );
      }
    } catch (error) {
      logger.warn(loggerMessages.web.fxRatesFetchFailed, {
        attributes: {
          baseCurrency,
          symbols: currencies
            .filter((currency) => currency !== baseCurrency)
            .join(","),
        },
        error,
      });
    }
  }, []);

  React.useEffect(() => {
    void loadRates();
  }, [loadRates]);

  const refreshRates = React.useCallback(() => loadRates(true), [loadRates]);

  return { rates, refreshRates };
}

export function useFiltersOpen() {
  const [filtersOpen, setFiltersOpenState] = React.useState(true);

  React.useEffect(() => {
    const media = window.matchMedia(compactMediaQuery);
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

    if (!window.matchMedia(compactMediaQuery).matches) {
      window.localStorage.setItem(filtersClosedStorageKey, open ? "0" : "1");
    }
  }, []);

  return [filtersOpen, setFiltersOpen] as const;
}
