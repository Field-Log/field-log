import { ClerkProvider as TanStackClerkProvider } from "@clerk/tanstack-react-start";
import { shadcn } from "@clerk/ui/themes";
import type * as React from "react";
import { clientEnv } from "@/env/client";

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <TanStackClerkProvider
      appearance={{ theme: shadcn }}
      publishableKey={clientEnv.VITE_CLERK_PUBLISHABLE_KEY}
      signUpUrl={clientEnv.VITE_CLERK_SIGN_UP_URL}
    >
      {children}
    </TanStackClerkProvider>
  );
}
