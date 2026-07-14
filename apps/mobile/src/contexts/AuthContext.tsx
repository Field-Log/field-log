import { useClerk, useAuth as useClerkAuth, useUser } from "@clerk/expo";
import type React from "react";
import { createContext, useContext, useMemo } from "react";

type MobileUser = {
  displayName: string | null;
  email: string | null;
  id: string;
};

type AuthContextType = {
  loading: boolean;
  signOut: () => Promise<void>;
  user: MobileUser | null;
};

const AuthContext = createContext<AuthContextType>({
  loading: true,
  signOut: async () => {},
  user: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: authLoaded, isSignedIn } = useClerkAuth({
    treatPendingAsSignedOut: false,
  });
  const clerk = useClerk();
  const { isLoaded: userLoaded, user } = useUser();

  const contextUser = useMemo<MobileUser | null>(() => {
    if (!isSignedIn || !user) {
      return null;
    }

    return {
      displayName: user.fullName ?? user.username ?? null,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      id: user.id,
    };
  }, [isSignedIn, user]);

  const signOut = async () => {
    await clerk.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        loading: !authLoaded || !userLoaded,
        signOut,
        user: contextUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
