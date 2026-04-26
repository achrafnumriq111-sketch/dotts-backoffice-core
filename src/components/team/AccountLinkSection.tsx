import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Mail, Send, Unlink, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Employee } from "@/hooks/useEmployees";

function mapLinkError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("no_user_with_that_email")) {
    return "Geen account gevonden met dit e-mailadres. Vraag de medewerker eerst een account te maken via /signup.";
  }
  if (m.includes("user_already_linked_to_another_employee")) {
    return "Dit account is al aan een andere medewerker gekoppeld.";
  }
  if (m.includes("employee_not_found")) return "Medewerker niet gevonden.";
  if (m.includes("forbidden")) return "Je hebt geen rechten om dit te doen.";
  return msg || "Er ging iets mis";
}

function mapInviteError(code: string): string {
  const c = code.toLowerCase();
  if (c.includes("unauthorized")) return "Je bent niet ingelogd.";
  if (c.includes("forbidden")) return "Alleen owners en managers kunnen uitnodigen.";
  if (c.includes("employee_not_found")) return "Medewerker niet gevonden.";
  if (c.includes("employee_has_no_email"))
    return "Deze medewerker heeft geen e-mailadres. Vul eerst een e-mail in.";
  if (c.includes("already_linked"))
    return "Deze medewerker heeft al een gekoppeld account.";
  if (c.includes("invite_failed")) return "Uitnodiging mislukt. Probeer opnieuw.";
  return code || "Er ging iets mis";
}

interface Props {
  employee: Employee;
}

export function AccountLinkSection({ employee }: Props) {
  const qc = useQueryClient();
  const isLinked = !!employee.user_id;
  const isInvited = !isLinked && !!employee.invited_at;
  const [email, setEmail] = useState(employee.email ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showManualLink, setShowManualLink] = useState(false);

  const linkedEmailQuery = useQuery({
    queryKey: ["linked-email", employee.id, employee.user_id],
    enabled: isLinked,
    queryFn: async (): Promise<string | null> => {
      // RPC may not yet be in generated types; cast to satisfy TS.
      const { data, error } = await (supabase.rpc as unknown as (
        name: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: string | null; error: Error | null }>)(
        "get_linked_email",
        { p_employee_id: employee.id },
      );
      if (error) throw error;
      return data ?? null;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["employees"] });
    qc.invalidateQueries({ queryKey: ["employee", employee.id] });
    qc.invalidateQueries({ queryKey: ["linked-email", employee.id] });
  };

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("invite-employee", {
        body: { employee_id: employee.id },
      });
      if (error) {
        // Try to surface a structured error code from the function body.
        const ctx = (error as { context?: { body?: unknown } }).context;
        let code = error.message;
        try {
          const body = ctx?.body;
          const parsed =
            typeof body === "string" ? JSON.parse(body) : (body as { error?: string } | undefined);
          if (parsed?.error) code = parsed.error;
        } catch {
          // ignore
        }
        throw new Error(code);
      }
      const payload = data as { error?: string; success?: boolean };
      if (payload?.error) throw new Error(payload.error);
      return payload;
    },
    onSuccess: () => {
      invalidate();
      toast.success(
        employee.email
          ? `Uitnodiging verstuurd naar ${employee.email}`
          : "Uitnodiging verstuurd",
      );
    },
    onError: (e: Error) => toast.error(mapInviteError(e.message)),
  });

  const linkMutation = useMutation({
    mutationFn: async () => {
      const trimmed = email.trim();
      if (!trimmed) throw new Error("Vul een e-mailadres in.");
      const { error } = await supabase.rpc("admin_link_employee", {
        p_employee_id: employee.id,
        p_user_email: trimmed,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Account gekoppeld");
    },
    onError: (e: Error) => toast.error(mapLinkError(e.message)),
  });

  const unlinkMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_unlink_employee", {
        p_employee_id: employee.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Account ontkoppeld");
      setConfirmOpen(false);
    },
    onError: (e: Error) => toast.error(mapLinkError(e.message)),
  });

  const manualLinkBlock = (
    <div className="mt-3 border-t border-border pt-3">
      {!showManualLink ? (
        <button
          type="button"
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          onClick={() => setShowManualLink(true)}
        >
          Of koppel een bestaand account
        </button>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="link-email" className="text-xs">
              E-mail van bestaand account
            </Label>
            <Input
              id="link-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="medewerker@voorbeeld.nl"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => linkMutation.mutate()}
            disabled={linkMutation.isPending || !email.trim()}
          >
            {linkMutation.isPending ? "Bezig…" : "Koppelen"}
          </Button>
        </div>
      )}
    </div>
  );

  if (isLinked) {
    const linkedEmail = linkedEmailQuery.data;
    return (
      <div className="rounded-md border border-border p-4">
        <div className="mb-1 flex items-center gap-2 text-sm font-medium">
          <UserCheck className="h-4 w-4 text-success" />
          Account
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Gekoppeld aan:{" "}
          <span className="font-medium text-foreground">
            {linkedEmailQuery.isLoading ? "…" : linkedEmail ?? "(onbekend)"}
          </span>
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <Unlink className="h-3.5 w-3.5" />
          Ontkoppel account
        </Button>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Account ontkoppelen?</AlertDialogTitle>
              <AlertDialogDescription>
                Weet je zeker dat je dit account wilt ontkoppelen? {employee.first_name}{" "}
                {employee.last_name} kan dan niet meer inloggen op deze organisatie.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuleren</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  unlinkMutation.mutate();
                }}
                disabled={unlinkMutation.isPending}
              >
                Ontkoppelen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if (isInvited) {
    const invitedAt = employee.invited_at!;
    return (
      <div className="rounded-md border border-border p-4">
        <div className="mb-1 flex items-center gap-2 text-sm font-medium">
          <Mail className="h-4 w-4 text-primary" />
          Uitnodiging verstuurd
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Verstuurd op{" "}
          <span className="font-medium text-foreground">
            {format(new Date(invitedAt), "d MMM yyyy", { locale: nl })}
          </span>
          . Wacht tot de medewerker zijn account aanmaakt, of koppel handmatig.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={() => inviteMutation.mutate()}
          disabled={inviteMutation.isPending || !employee.email}
        >
          <Send className="h-3.5 w-3.5" />
          {inviteMutation.isPending ? "Bezig…" : "Stuur opnieuw"}
        </Button>
        {manualLinkBlock}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border p-4">
      <div className="mb-1 flex items-center gap-2 text-sm font-medium">
        <Link2 className="h-4 w-4 text-primary" />
        Account
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Verstuur een uitnodiging zodat deze medewerker kan inloggen en zijn/haar rooster,
        beschikbaarheid en verlof kan beheren.
      </p>
      <Button
        type="button"
        className="gap-2"
        onClick={() => inviteMutation.mutate()}
        disabled={inviteMutation.isPending || !employee.email}
      >
        <Send className="h-3.5 w-3.5" />
        {inviteMutation.isPending ? "Bezig…" : "Verstuur uitnodiging"}
      </Button>
      {!employee.email && (
        <p className="mt-2 text-xs text-warning">
          Vul eerst een e-mailadres in voor deze medewerker.
        </p>
      )}
      {manualLinkBlock}
    </div>
  );
}