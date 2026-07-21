import { relations } from "drizzle-orm";
import { featureFlags, featureFlagUserOverrides } from "./feature-flags.js";
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

export const featureFlagsRelations = relations(featureFlags, ({ many }) => ({
  userOverrides: many(featureFlagUserOverrides),
}));

export const featureFlagUserOverridesRelations = relations(
  featureFlagUserOverrides,
  ({ one }) => ({
    flag: one(featureFlags, {
      fields: [featureFlagUserOverrides.flagId],
      references: [featureFlags.id],
    }),
    user: one(users, {
      fields: [featureFlagUserOverrides.userId],
      references: [users.id],
    }),
  }),
);
