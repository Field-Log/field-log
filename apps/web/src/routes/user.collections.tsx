import { createFileRoute } from "@tanstack/react-router";
import { UserCollectionsPage } from "@/pages/user-collections-page";

export const Route = createFileRoute("/user/collections")({
  component: UserCollectionsPage,
});
