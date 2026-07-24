import { createFileRoute } from "@tanstack/react-router";
import { UserBetaFeaturesPage } from "@/pages/user-beta-features-page";

export const Route = createFileRoute("/user/settings/beta-features")({
  component: UserBetaFeaturesPage,
});
