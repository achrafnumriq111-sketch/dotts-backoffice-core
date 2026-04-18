import { ReactNode, useEffect } from "react";
import { useAuth, redirectToLogin } from "@/context/AuthContext";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) redirectToLogin();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Doorverwijzen naar inloggen…
      </div>
    );
  }

  return <>{children}</>;
}
