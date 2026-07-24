import { createFileRoute, notFound } from "@tanstack/react-router";
import { isFeatureFlagAdmin } from "@/lib/feature-flags";
import { AdminFeatureFlagsPage } from "@/pages/admin-feature-flags-page";

export const Route = createFileRoute("/admin/settings/feature-flags")({
  beforeLoad: async () => {
    if (!(await isFeatureFlagAdmin())) {
      throw notFound();
    }
  },
  component: AdminFeatureFlagsPage,
});
