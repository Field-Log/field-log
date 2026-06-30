import { UserAccountPage } from "@/components/user-account-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/user/account")({
  component: UserAccountPage,
});
