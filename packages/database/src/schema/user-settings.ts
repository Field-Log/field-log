import { pgEnum, pgTable, uuid } from "drizzle-orm/pg-core";
import {
  currencyCodes,
  dimensionUnits,
  themeModes,
  weightUnits,
} from "./enums.js";
import { users } from "./users.js";

export const currencyCodeEnum = pgEnum("currency_code", currencyCodes);
export const dimensionUnitEnum = pgEnum("dimension_unit", dimensionUnits);
export const themeModeEnum = pgEnum("theme_mode", themeModes);
export const weightUnitEnum = pgEnum("weight_unit", weightUnits);

export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  currencyCode: currencyCodeEnum("currency_code").notNull().default("USD"),
  dimensionUnit: dimensionUnitEnum("dimension_unit").notNull().default("in"),
  theme: themeModeEnum("theme").notNull().default("dark"),
  weightUnit: weightUnitEnum("weight_unit").notNull().default("g"),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
