import type { Database, User } from "@package/database";
import { schema } from "@package/database";
import { type Logger, loggerMessages } from "@package/logger";
import { hashLogIdentifier } from "../../logging.js";

export type EnsureUserInput = {
  clerkId: string;
};

export type UsersService = {
  ensure(input: EnsureUserInput): Promise<User>;
};

function assertClerkId(clerkId: string): void {
  if (!clerkId.trim()) {
    throw new Error("clerkId is required.");
  }
}

export function createUsersService(db: Database, logger: Logger): UsersService {
  return {
    async ensure({ clerkId }) {
      return await logger.operation(
        loggerMessages.database.users.ensure,
        async () => {
          assertClerkId(clerkId);

          const [user] = await db
            .insert(schema.users)
            .values({ clerkId })
            .onConflictDoUpdate({
              set: { clerkId },
              target: schema.users.clerkId,
            })
            .returning();

          if (!user) {
            throw new Error("Failed to ensure user.");
          }

          return user;
        },
        {
          attributes: {
            clerkIdHash: hashLogIdentifier(clerkId),
          },
        },
      );
    },
  };
}
