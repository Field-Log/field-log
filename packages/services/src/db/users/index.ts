import type { Database, User } from "@repo/database";
import { schema } from "@repo/database";

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

export function createUsersService(db: Database): UsersService {
  return {
    async ensure({ clerkId }) {
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
  };
}
