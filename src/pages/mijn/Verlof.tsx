import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrg } from "@/context/OrgContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { useMyTimeOff } from "@/hooks/useTimeOff";
import { TimeOffRequestDialog } from "@/components/timeoff/TimeOffRequestDialog";
import { TimeOffStatusBadge, TIME_OFF_TYPE_LABELS } from "@/components/timeoff/TimeOffStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { dayCount, formatRangeNL } from "@/lib/dateNl";

export default function MijnVerlof() {
  const { currentOrg } = useOrg();
  const { myEmployeeId } = useTeamPermissions();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const { data: requests = [] } = useMyTimeOff(myEmployeeId ?? undefined);

  const stats = useMemo(() => {
    const year = new Date().getFullYear();
    const pending = requests.filter((r) => r.status === "pending").length;
    const approvedDays = requests
      .filter((r) => r.status === "approved" && new Date(r.start_date).getFullYear() === year)
      .reduce((sum, r) => sum + dayCount(r.start_date, r.end_date), 0);
    return { pending, approvedDays };
  }, [requests]);

  if (!currentOrg) return null;
  if (!myEmployeeId) {
    return (
      <>
        <PageHeader title="Mijn verlof" subtitle="Bekijk en beheer je verlofaanvragen." />
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Je bent nog niet gekoppeld als medewerker. Neem contact op met je manager.
        </Card>
      </>
    );
  }

  async function cancel(id: string) {
    const { error } = await supabase.rpc("cancel_time_off", { p_request_id: id });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Aanvraag geannuleerd");
    qc.invalidateQueries({ queryKey: ["my_time_off", myEmployeeId] });
    qc.invalidateQueries({ queryKey: ["pending_time_off"] });
  }

  return (
    <>
      <PageHeader title="Mijn verlof" subtitle="Bekijk en beheer je verlofaanvragen." />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 md:max-w-md">
        <Card className="p-4">
          <div className="text-xs uppercase text-muted-foreground">Openstaand</div>
          <div className="mt-1 text-2xl font-semibold">{stats.pending}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase text-muted-foreground">Goedgekeurd dit jaar</div>
          <div className="mt-1 text-2xl font-semibold">{stats.approvedDays} <span className="text-sm font-normal text-muted-foreground">dagen</span></div>
        </Card>
      </div>

      <div className="mb-4 flex justify-end">
        <Button className="gap-2" onClick={() => setDialog(true)}>
          <Plus className="h-4 w-4" /> Verlof aanvragen
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Nog geen verlofaanvragen.
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {requests.map((r) => (
              <li key={r.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{TIME_OFF_TYPE_LABELS[r.type]}</Badge>
                      <TimeOffStatusBadge status={r.status} />
                    </div>
                    <p className="text-sm">
                      {formatRangeNL(r.start_date, r.end_date)} ·{" "}
                      <span className="text-muted-foreground">
                        {dayCount(r.start_date, r.end_date)} {dayCount(r.start_date, r.end_date) === 1 ? "dag" : "dagen"}
                      </span>
                    </p>
                    {r.note && <p className="text-sm text-muted-foreground">"{r.note}"</p>}
                    {r.status === "rejected" && r.decision_note && (
                      <p className="text-sm text-destructive">Reden afwijzing: {r.decision_note}</p>
                    )}
                  </div>
                  {(r.status === "pending" || r.status === "approved") && (
                    <Button variant="outline" size="sm" onClick={() => cancel(r.id)}>
                      Annuleren
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <TimeOffRequestDialog open={dialog} onOpenChange={setDialog} employeeId={myEmployeeId} />
    </>
  );
}
