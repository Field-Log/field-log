import { relations } from "drizzle-orm";
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
