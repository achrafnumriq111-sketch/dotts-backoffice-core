import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
}

interface AuthContextValue {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_BASE_URL = "https://auth.mydotts.nl";

// Mocked session for now. Replace with real Supabase session later.
const MOCK_USER: User = {
  id: "usr_mock_1",
  name: "Sanne de Vries",
  email: "sanne@brouwcafe.nl",
  avatarUrl: undefined,
};

const MOCK_ORG: Organization = {
  id: "org_mock_1",
  name: "Brouwcafé De Hoek",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // In real wiring this would come from Supabase. For now we simulate "logged in".
  const [user] = useState<User | null>(MOCK_USER);
  const [organization] = useState<Organization | null>(MOCK_ORG);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      organization,
      isAuthenticated: user !== null,
      signOut: () => {
        const redirect = encodeURIComponent(window.location.href);
        window.location.href = `${AUTH_BASE_URL}/logout?redirect=${redirect}`;
      },
    }),
    [user, organization],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function redirectToLogin(): void {
  const redirect = encodeURIComponent(window.location.href);
  window.location.href = `${AUTH_BASE_URL}/login?redirect=${redirect}`;
}
