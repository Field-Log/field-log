import type { Database } from "@repo/database";
import {
  createUserSettingsService,
  type UserSettingsService,
} from "./user-settings/index.js";
import { createUsersService, type UsersService } from "./users/index.js";

export type DbServices = {
  userSettings: UserSettingsService;
  users: UsersService;
};

export function createDbServices(db: Database): DbServices {
  const users = createUsersService(db);

  return {
    userSettings: createUserSettingsService(db, users),
    users,
  };
}
