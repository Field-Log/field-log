import { mobileEnv } from "../env";
import { mobileAppVersion } from "./app-version";

export type MobileUpdateSeverity = "none" | "recommended" | "required";

export type MobileVersionPolicy = {
  androidStoreUrl: string | null;
  iosStoreUrl: string | null;
  latestVersion: string | null;
  minimumSupportedVersion: string | null;
  severity: MobileUpdateSeverity;
};

export type MobileUpdateDecision = {
  policy: MobileVersionPolicy;
  severity: Exclude<MobileUpdateSeverity, "none">;
};

function createMobileVersionPolicyUrl(apiUrl: string) {
  return `${apiUrl.replace(/\/+$/, "")}/api/v0/mobile-version`;
}

function parseVersion(version: string): number[] {
  return version.split(".").map((part) => Number.parseInt(part, 10) || 0);
}

export function compareVersions(left: string, right: string): number {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;

    if (leftPart !== rightPart) {
      return leftPart > rightPart ? 1 : -1;
    }
  }

  return 0;
}

export async function fetchMobileVersionPolicy(
  init: Pick<RequestInit, "signal"> = {},
): Promise<MobileVersionPolicy | null> {
  if (!mobileEnv.EXPO_PUBLIC_API_URL) {
    return null;
  }

  const response = await fetch(
    createMobileVersionPolicyUrl(mobileEnv.EXPO_PUBLIC_API_URL),
    init,
  );

  if (!response.ok) {
    throw new Error(`Mobile version policy request failed: ${response.status}`);
  }

  return response.json() as Promise<MobileVersionPolicy>;
}

export function getMobileUpdateDecision(
  policy: MobileVersionPolicy | null,
  installedVersion = mobileAppVersion,
): MobileUpdateDecision | null {
  if (!policy || policy.severity === "none") {
    return null;
  }

  if (
    policy.minimumSupportedVersion &&
    compareVersions(installedVersion, policy.minimumSupportedVersion) < 0
  ) {
    return {
      policy,
      severity: "required",
    };
  }

  if (
    policy.latestVersion &&
    compareVersions(installedVersion, policy.latestVersion) < 0
  ) {
    return {
      policy,
      severity: policy.severity,
    };
  }

  return null;
}
