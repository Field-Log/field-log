import { ClerkLoaded, ClerkLoading, SignIn } from "@clerk/tanstack-react-start";
import { AuthPageSkeleton } from "@/components/skeletons/auth-page-skeleton";

export function SignInPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10 text-foreground">
      <ClerkLoading>
        <AuthPageSkeleton />
      </ClerkLoading>
      <ClerkLoaded>
        <SignIn signUpUrl={import.meta.env.VITE_CLERK_SIGN_UP_URL} />
      </ClerkLoaded>
    </main>
  );
}
