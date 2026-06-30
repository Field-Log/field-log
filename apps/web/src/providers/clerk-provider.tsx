import { ClerkProvider as TanStackClerkProvider } from "@clerk/tanstack-react-start";
import { shadcn } from "@clerk/ui/themes";
import type * as React from "react";

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <TanStackClerkProvider
      appearance={{ theme: shadcn }}
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-in"
    >
      {children}
    </TanStackClerkProvider>
  );
}
