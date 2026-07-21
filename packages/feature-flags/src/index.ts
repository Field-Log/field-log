export const featureFlagAudiences = ["global", "admin", "user"] as const;

export type FeatureFlagAudience = (typeof featureFlagAudiences)[number];

export const featureFlagOverrideSources = ["admin", "user"] as const;

export type FeatureFlagOverrideSource =
  (typeof featureFlagOverrideSources)[number];

export type FeatureFlagContext = {
  clerkId?: string;
};

export type FeatureFlagResolver = (
  slug: string,
  context?: FeatureFlagContext,
) => Promise<boolean>;

export type FeatureFlagChecker = (
  context?: FeatureFlagContext,
) => Promise<boolean>;

const featureFlagSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isFeatureFlagSlug(value: string): boolean {
  return featureFlagSlugPattern.test(value);
}

export function assertFeatureFlagSlug(value: string): void {
  if (!isFeatureFlagSlug(value)) {
    throw new Error(
      "Feature flag slug must use lowercase letters, numbers, and hyphens.",
    );
  }
}

export function defineFlag(slug: string): string {
  assertFeatureFlagSlug(slug);

  return slug;
}

export function createFlagChecker(
  resolver: FeatureFlagResolver,
): (slug: string) => FeatureFlagChecker {
  return (slug: string) => {
    const definedSlug = defineFlag(slug);

    return async (context?: FeatureFlagContext) => {
      return await resolver(definedSlug, context);
    };
  };
}
