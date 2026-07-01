import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getAuthState } from "@/lib/auth";

export const Route = createFileRoute("/user")({
  beforeLoad: async () => {
    const { isAuthenticated } = await getAuthState();

    if (!isAuthenticated) {
      throw redirect({ params: { _splat: "" }, to: "/sign-in/$" });
    }
  },
  component: UserLayout,
});

function UserLayout() {
  return <Outlet />;
}
