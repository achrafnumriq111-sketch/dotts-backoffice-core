import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DottsLogo } from "@/components/layout/DottsLogo";
import { toast } from "sonner";

const AUTH_BASE_URL = "https://auth.mydotts.nl";

type Mode = "checking" | "set-password" | "logged-in" | "not-logged-in";

export default function Welcome() {
  const [mode, setMode] = useState<Mode>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const isInviteFlow =
      hash.includes("type=invite") ||
      hash.includes("type=recovery") ||
      hash.includes("type=signup");

    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (isInviteFlow) {
          setMode("set-password");
        } else {
          window.location.replace("/mijn/rooster");
        }
      } else {
        setMode("not-logged-in");
      }
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Wachtwoord moet minimaal 8 tekens zijn.");
      return;
    }
    if (password !== confirm) {
      toast.error("Wachtwoorden komen niet overeen.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast.error("Wachtwoord instellen mislukt: " + error.message);
      return;
    }
    toast.success("Wachtwoord ingesteld. Welkom bij Dotts!");
    window.location.replace("/mijn/rooster");
  };

  if (mode === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Laden…</p>
        </div>
      </div>
    );
  }

  if (mode === "set-password") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <form
          onSubmit={submit}
          className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm"
        >
          <div className="mb-6 flex justify-center">
            <DottsLogo />
          </div>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold">Stel je wachtwoord in</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Welkom bij Dotts. Kies een wachtwoord om je account te activeren.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nieuw wachtwoord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Bevestig wachtwoord</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Bezig…" : "Wachtwoord instellen en doorgaan"}
            </Button>
          </div>
        </form>
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
          Log in om door te gaan.
        </p>
        <Button asChild size="lg" className="mt-6 w-full">
          <a href={`${AUTH_BASE_URL}/login`}>Inloggen</a>
        </Button>
      </div>
    </div>
  );
}