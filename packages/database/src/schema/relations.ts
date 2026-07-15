import { relations } from "drizzle-orm";
import {
  makers,
  scraperRuns,
  tmpAutmogPenImages,
  tmpAutmogPens,
  tmpAutmogPenVersions,
} from "./scraper.js";
import { userSettings } from "./user-settings.js";
import { users } from "./users.js";

export const usersRelations = relations(users, ({ one }) => ({
  settings: one(userSettings),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const makersRelations = relations(makers, ({ many }) => ({
  autmogPens: many(tmpAutmogPens),
}));

export const scraperRunsRelations = relations(scraperRuns, () => ({}));

export const tmpAutmogPensRelations = relations(
  tmpAutmogPens,
  ({ many, one }) => ({
    images: many(tmpAutmogPenImages),
    maker: one(makers, {
      fields: [tmpAutmogPens.makerId],
      references: [makers.id],
    }),
    versions: many(tmpAutmogPenVersions),
  }),
);

export const tmpAutmogPenImagesRelations = relations(
  tmpAutmogPenImages,
  ({ one }) => ({
    pen: one(tmpAutmogPens, {
      fields: [tmpAutmogPenImages.penId],
      references: [tmpAutmogPens.id],
    }),
  }),
);

export const tmpAutmogPenVersionsRelations = relations(
  tmpAutmogPenVersions,
  ({ one }) => ({
    pen: one(tmpAutmogPens, {
      fields: [tmpAutmogPenVersions.penId],
      references: [tmpAutmogPens.id],
    }),
  }),
);
