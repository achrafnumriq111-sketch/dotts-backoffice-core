import { ReactNode, useEffect, useState } from "react";
import { Loader2, ShieldX } from "lucide-react";
import { useAuth, redirectToLogin } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type State = "checking" | "allowed" | "forbidden" | "unauthenticated";

export function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      setState("unauthenticated");
      redirectToLogin();
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("is_dotts_admin");
      if (cancelled) return;
      if (error || !data) {
        setState("forbidden");
      } else {
        setState("allowed");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session, authLoading]);

  if (state === "checking" || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-center">
        <ShieldX className="h-12 w-12 text-destructive" />
        <div>
          <p className="text-lg font-semibold">Geen toegang</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Dit gedeelte is alleen toegankelijk voor Dotts-administrators.
          </p>
        </div>
        <a href="/dashboard" className="text-sm text-primary underline">
          Terug naar dashboard
        </a>
      </div>
    );
  }

  if (state === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Doorverwijzen naar inloggen…
      </div>
    );
  }

  return <>{children}</>;
}
