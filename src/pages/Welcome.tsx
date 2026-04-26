import { useEffect, useState } from "react";
import { Loader2, LogIn, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DottsLogo } from "@/components/layout/DottsLogo";

const AUTH_BASE_URL = "https://auth.mydotts.nl";

export default function Welcome() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If Supabase passes a recovery/invite token in the URL hash, the
    // auth client will pick it up automatically. Give it a tick, then
    // check for an active session.
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        window.location.replace("/mijn/rooster");
        return;
      }
      setChecking(false);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <DottsLogo />
        </div>
        <h1 className="text-center text-2xl font-semibold">Welkom bij Dotts</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Je bent uitgenodigd om je profiel te beheren — log in of stel een wachtwoord
          in om te beginnen.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            asChild
            size="lg"
            className="w-full"
          >
            <a href={`${AUTH_BASE_URL}/login`}>
              <LogIn className="mr-2 h-4 w-4" />
              Inloggen
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <a href={`${AUTH_BASE_URL}/recover`}>
              <KeyRound className="mr-2 h-4 w-4" />
              Wachtwoord instellen
            </a>
          </Button>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Heb je problemen? Neem contact op met je manager.
        </p>
      </div>
    </div>
  );
}