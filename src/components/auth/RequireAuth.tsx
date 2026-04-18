import { ReactNode, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth, redirectToLogin } from "@/context/AuthContext";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) redirectToLogin();
  }, [loading, session]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Doorverwijzen naar inloggen…
      </div>
    );
  }

  return <>{children}</>;
}
