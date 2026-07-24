import type { Database, User, UserSettings } from "@package/database";
import {
  createLogger,
  type LogEvent,
  type LogTransport,
  loggerMessages,
} from "@package/logger";
import { describe, expect, it, vi } from "vitest";
import { hashLogIdentifier } from "../logging.js";
import { createUserSettingsService } from "./user-settings/index.js";
import { createUsersService } from "./users/index.js";

function captureLogger(events: LogEvent[]) {
  const transport: LogTransport = {
    log(event) {
      events.push(event);
    },
  };

  return createLogger({
    app: "api",
    environment: "test",
    transports: [transport],
  });
}

function createDbMock(input: {
  insertRows?: unknown[][];
  selectRows?: unknown[][];
}): Database {
  const insertRows = [...(input.insertRows ?? [])];
  const selectRows = [...(input.selectRows ?? [])];

  return {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue(insertRows.shift() ?? []),
        })),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue(selectRows.shift() ?? []),
          })),
        })),
      })),
    })),
  } as unknown as Database;
}

describe("database service logging", () => {
  it("logs users.ensure with a hashed clerk id", async () => {
    const events: LogEvent[] = [];
    const clerkId = "clerk-secret-123";
    const logger = captureLogger(events);
    const user: User = {
      clerkId,
      id: 1000,
    };
    const db = createDbMock({
      insertRows: [[user]],
    });
    const users = createUsersService(db, logger);

    await expect(users.ensure({ clerkId })).resolves.toEqual(user);
    await logger.flush();

    expect(events).toHaveLength(1);
    expect(events[0]?.message).toBe(
      `${loggerMessages.database.users.ensure}.succeeded`,
    );
    expect(events[0]?.attributes).toMatchObject({
      clerkIdHash: hashLogIdentifier(clerkId),
      operation: loggerMessages.database.users.ensure,
      outcome: "success",
    });
    expect(JSON.stringify(events)).not.toContain(clerkId);
  });

  it("logs users.ensure failures with a failure outcome", async () => {
    const events: LogEvent[] = [];
    const logger = captureLogger(events);
    const users = createUsersService(
      createDbMock({
        insertRows: [[]],
      }),
      logger,
    );

    await expect(users.ensure({ clerkId: "clerk-failed-1" })).rejects.toThrow(
      "Failed to ensure user",
    );
    await logger.flush();

    expect(events[0]?.message).toBe(
      `${loggerMessages.database.users.ensure}.failed`,
    );
    expect(events[0]?.attributes).toMatchObject({
      operation: loggerMessages.database.users.ensure,
      outcome: "failure",
    });
  });

  it("logs userSettings.getByClerkId with a hashed clerk id", async () => {
    const events: LogEvent[] = [];
    const clerkId = "clerk-settings-1";
    const logger = captureLogger(events);
    const settings: UserSettings = {
      currencyCode: "CAD",
      dimensionUnit: "in",
      theme: "dark",
      userId: 1000,
      weightUnit: "g",
    };
    const service = createUserSettingsService(
      createDbMock({
        selectRows: [[settings]],
      }),
      createUsersService(createDbMock({}), logger),
      logger,
    );

    await expect(service.getByClerkId(clerkId)).resolves.toEqual(settings);
    await logger.flush();

    expect(events).toHaveLength(1);
    expect(events[0]?.message).toBe(
      `${loggerMessages.database.userSettings.getByClerkId}.succeeded`,
    );
    expect(events[0]?.attributes).toMatchObject({
      clerkIdHash: hashLogIdentifier(clerkId),
      operation: loggerMessages.database.userSettings.getByClerkId,
      outcome: "success",
    });
    expect(JSON.stringify(events)).not.toContain(clerkId);
  });

  it("logs nested upsert operations with settings metadata", async () => {
    const events: LogEvent[] = [];
    const clerkId = "clerk-upsert-1";
    const logger = captureLogger(events);
    const user: User = {
      clerkId,
      id: 1000,
    };
    const settings = {
      currencyCode: "USD",
      dimensionUnit: "mm",
      theme: "light",
      weightUnit: "oz",
    } as const;
    const userSettings: UserSettings = {
      ...settings,
      userId: user.id,
    };
    const db = createDbMock({
      insertRows: [[user], [userSettings]],
    });
    const users = createUsersService(db, logger);
    const service = createUserSettingsService(db, users, logger);

    await expect(service.upsertForClerkId(clerkId, settings)).resolves.toEqual(
      userSettings,
    );
    await logger.flush();

    expect(events.map((event) => event.message)).toEqual([
      `${loggerMessages.database.users.ensure}.succeeded`,
      `${loggerMessages.database.userSettings.upsertForClerkId}.succeeded`,
    ]);
    expect(events[1]?.attributes).toMatchObject({
      clerkIdHash: hashLogIdentifier(clerkId),
      operation: loggerMessages.database.userSettings.upsertForClerkId,
      outcome: "success",
      settingKeys: ["currencyCode", "dimensionUnit", "theme", "weightUnit"],
      settings,
    });
    expect(JSON.stringify(events)).not.toContain(clerkId);
  });
});
