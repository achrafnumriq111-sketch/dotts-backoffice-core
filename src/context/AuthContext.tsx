import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AUTH_BASE_URL = "https://auth.mydotts.nl";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    // Subscribe FIRST so we never miss an event between getSession and listener setup.
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setLoading(false);

      // On sign-in, attempt to auto-claim an employee profile (if any).
      // Defer to avoid blocking the auth callback.
      if (event === "SIGNED_IN" && newSession?.user) {
        setTimeout(() => {
          supabase.rpc("claim_my_employee").then(({ data, error }) => {
            if (error) return; // silent
            if (data) {
              toast.success("Welkom! Je profiel is automatisch gekoppeld.");
              qc.invalidateQueries({ queryKey: ["employees"] });
              qc.invalidateQueries({ queryKey: ["my-employee-id"] });
              qc.invalidateQueries({ queryKey: ["timeoff-pending-count"] });
              qc.invalidateQueries({ queryKey: ["shifts-draft-count"] });
            }
          });
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
        window.location.href = `${AUTH_BASE_URL}/login`;
      },
    }),
    [session, loading],
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
