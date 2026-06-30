import { ClerkLoaded, ClerkLoading, SignIn } from "@clerk/tanstack-react-start";
import { Skeleton } from "@/components/ui/skeleton";

export function SignInPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10 text-foreground">
      <ClerkLoading>
        <SignInSkeleton />
      </ClerkLoading>
      <ClerkLoaded>
        <SignIn
          signInUrl={import.meta.env.VITE_CLERK_SIGN_IN_URL}
          signUpUrl={import.meta.env.VITE_CLERK_SIGN_UP_URL}
        />
      </ClerkLoaded>
    </main>
  );
}

function SignInSkeleton() {
  return (
    <div className="w-full max-w-100 rounded-lg border border-border bg-card p-6 shadow-sm">
      <Skeleton className="mx-auto size-10 rounded-full" />
      <Skeleton className="mx-auto mt-5 h-6 w-40" />
      <Skeleton className="mx-auto mt-3 h-4 w-52" />
      <div className="mt-8 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
