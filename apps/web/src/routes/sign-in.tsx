import { createFileRoute, redirect } from "@tanstack/react-router";
import { SignInPage } from "@/components/sign-in-page";
import { getAuthState } from "@/lib/auth";

export const Route = createFileRoute("/sign-in")({
  beforeLoad: async () => {
    const { isAuthenticated } = await getAuthState();

    if (isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
  component: SignInPage,
});
