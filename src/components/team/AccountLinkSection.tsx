import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Unlink, UserCheck } from "lucide-react";
import { toast } from "sonner";
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

interface Props {
  employee: Employee;
}

export function AccountLinkSection({ employee }: Props) {
  const qc = useQueryClient();
  const isLinked = !!employee.user_id;
  const [email, setEmail] = useState(employee.email ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  return (
    <div className="rounded-md border border-border p-4">
      <div className="mb-1 flex items-center gap-2 text-sm font-medium">
        <Link2 className="h-4 w-4 text-primary" />
        Account koppelen
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Koppel een Dotts-account aan deze medewerker zodat hij/zij kan inloggen en zijn/haar
        rooster, beschikbaarheid en verlof kan beheren.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="link-email">E-mail</Label>
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
          onClick={() => linkMutation.mutate()}
          disabled={linkMutation.isPending || !email.trim()}
        >
          {linkMutation.isPending ? "Bezig…" : "Koppel account"}
        </Button>
      </div>
    </div>
  );
}