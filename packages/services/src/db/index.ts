import type { Database } from "@repo/database";
import type { Logger } from "@repo/logger";
import {
  createUserSettingsService,
  type UserSettingsService,
} from "./user-settings/index.js";
import { createUsersService, type UsersService } from "./users/index.js";

export type DbServices = {
  userSettings: UserSettingsService;
  users: UsersService;
};

export function createDbServices(db: Database, logger: Logger): DbServices {
  const users = createUsersService(db, logger);

  return {
    userSettings: createUserSettingsService(db, users, logger),
    users,
  };
}
