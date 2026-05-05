import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_PATH = "/dashboard";

function getRedirectTarget(): string {
  if (typeof window === "undefined") return FALLBACK_PATH;

  const search = new URLSearchParams(window.location.search);
  const next = search.get("next") || search.get("redirect") || FALLBACK_PATH;

  try {
    const target = new URL(next, window.location.origin);
    if (target.origin !== window.location.origin) return FALLBACK_PATH;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return FALLBACK_PATH;
  }
}

export default function AuthCallback() {
  useEffect(() => {
    let active = true;

    const finish = async () => {
      try {
        // PKCE flow returns ?code=...; exchange it for a session.
        const code = new URLSearchParams(window.location.search).get("code");
        if (code) {
          await supabase.auth.exchangeCodeForSession(window.location.href);
        } else {
          await supabase.auth.getSession();
        }
      } finally {
        if (!active) return;
        window.location.replace(getRedirectTarget());
      }
    };

    void finish();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Inloggen afronden…
      </div>
    </div>
  );
}