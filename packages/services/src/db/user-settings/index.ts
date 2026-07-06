import type {
  CurrencyCode,
  Database,
  DimensionUnit,
  ThemeMode,
  UserSettings,
  WeightUnit,
} from "@repo/database";
import { schema } from "@repo/database";
import { type Logger, loggerMessages } from "@repo/logger";
import { eq } from "drizzle-orm";
import { hashLogIdentifier } from "../../logging.js";
import type { UsersService } from "../users/index.js";

export type UpsertUserSettingsInput = {
  currencyCode: CurrencyCode;
  dimensionUnit: DimensionUnit;
  theme: ThemeMode;
  weightUnit: WeightUnit;
};

export type UserSettingsService = {
  getByClerkId(clerkId: string): Promise<UserSettings | null>;
  upsertForClerkId(
    clerkId: string,
    settings: UpsertUserSettingsInput,
  ): Promise<UserSettings>;
};

export function createUserSettingsService(
  db: Database,
  usersService: UsersService,
  logger: Logger,
): UserSettingsService {
  return {
    async getByClerkId(clerkId) {
      return await logger.operation(
        loggerMessages.database.userSettings.getByClerkId,
        async () => {
          const [row] = await db
            .select({
              currencyCode: schema.userSettings.currencyCode,
              dimensionUnit: schema.userSettings.dimensionUnit,
              theme: schema.userSettings.theme,
              userId: schema.userSettings.userId,
              weightUnit: schema.userSettings.weightUnit,
            })
            .from(schema.userSettings)
            .innerJoin(
              schema.users,
              eq(schema.userSettings.userId, schema.users.id),
            )
            .where(eq(schema.users.clerkId, clerkId))
            .limit(1);

          return row ?? null;
        },
        {
          attributes: {
            clerkIdHash: hashLogIdentifier(clerkId),
          },
        },
      );
    },
    async upsertForClerkId(clerkId, settings) {
      return await logger.operation(
        loggerMessages.database.userSettings.upsertForClerkId,
        async () => {
          const user = await usersService.ensure({ clerkId });

          const [userSettings] = await db
            .insert(schema.userSettings)
            .values({
              ...settings,
              userId: user.id,
            })
            .onConflictDoUpdate({
              set: settings,
              target: schema.userSettings.userId,
            })
            .returning();

          if (!userSettings) {
            throw new Error("Failed to upsert user settings.");
          }

          return userSettings;
        },
        {
          attributes: {
            clerkIdHash: hashLogIdentifier(clerkId),
            settingKeys: Object.keys(settings),
            settings,
          },
        },
      );
    },
  };
}
