import { mobileEnv } from "../env";

export type MobileBetaFeatureFlag = {
  description: string | null;
  enabled: boolean;
  name: string;
  slug: string;
};

function createFeatureFlagsUrl(path: string) {
  if (!mobileEnv.EXPO_PUBLIC_API_URL) {
    throw new Error("Feature flags require EXPO_PUBLIC_API_URL.");
  }

  return `${mobileEnv.EXPO_PUBLIC_API_URL.replace(/\/+$/, "")}/api/v0${path}`;
}

export async function fetchBetaFeatureFlags(
  token: string,
): Promise<MobileBetaFeatureFlag[]> {
  const response = await fetch(createFeatureFlagsUrl("/feature-flags/beta"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Beta feature flags request failed: ${response.status}`);
  }

  const body = (await response.json()) as { flags?: MobileBetaFeatureFlag[] };

  return Array.isArray(body.flags) ? body.flags : [];
}

export async function setBetaFeatureFlag(input: {
  enabled: boolean;
  slug: string;
  token: string;
}): Promise<void> {
  const response = await fetch(
    createFeatureFlagsUrl(`/feature-flags/beta/${input.slug}`),
    {
      body: JSON.stringify({ enabled: input.enabled }),
      headers: {
        Authorization: `Bearer ${input.token}`,
        "Content-Type": "application/json",
      },
      method: "PUT",
    },
  );

  if (!response.ok) {
    throw new Error(`Beta feature flag update failed: ${response.status}`);
  }
}
