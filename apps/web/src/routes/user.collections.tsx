import { UserPageShell } from "@/components/user-page-shell";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/user/collections")({
  component: CollectionsPage,
});

function CollectionsPage() {
  return (
    <UserPageShell title="Collections">
      <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
        Collections will be available later.
      </div>
    </UserPageShell>
  );
}
