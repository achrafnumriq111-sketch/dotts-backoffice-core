import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrg } from "@/context/OrgContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { useAvailabilityExceptions, type AvailabilityException } from "@/hooks/useAvailability";
import { WeekPatternEditor } from "@/components/availability/WeekPatternEditor";
import { ExceptionDialog } from "@/components/availability/ExceptionDialog";
import { supabase } from "@/integrations/supabase/client";
import { toIsoDate, trimTime } from "@/lib/dateNl";

function NotLinked() {
  return (
    <Card className="p-10 text-center">
      <p className="text-sm text-muted-foreground">
        Je bent nog niet gekoppeld als medewerker. Neem contact op met je manager.
      </p>
    </Card>
  );
}

function addDaysLocal(d: Date, n: number) { const c = new Date(d); c.setDate(c.getDate() + n); return c; }

export default function MijnBeschikbaarheid() {
  const { currentOrg } = useOrg();
  const { myEmployeeId } = useTeamPermissions();
  const qc = useQueryClient();
  const today = new Date();
  const startIso = toIsoDate(today);
  const endIso = toIsoDate(addDaysLocal(today, 60));
  const { data: exceptions = [] } = useAvailabilityExceptions(myEmployeeId ?? undefined, startIso, endIso);
  const [excDialog, setExcDialog] = useState<AvailabilityException | null | "new">(null);

  if (!currentOrg) return null;
  if (!myEmployeeId) {
    return (
      <>
        <PageHeader title="Mijn beschikbaarheid" subtitle="Geef je standaard wekelijkse patroon en uitzonderingen door." />
        <NotLinked />
      </>
    );
  }

  async function deleteException(id: string) {
    const { error } = await supabase.rpc("delete_availability_exception", { p_id: id });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Uitzondering verwijderd");
    qc.invalidateQueries({ queryKey: ["availability_exceptions", myEmployeeId] });
    qc.invalidateQueries({ queryKey: ["team_availability"] });
  }

  return (
    <>
      <PageHeader title="Mijn beschikbaarheid" subtitle="Geef je standaard wekelijkse patroon en uitzonderingen door." />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Weekpatroon</h2>
        <WeekPatternEditor employeeId={myEmployeeId} />
      </section>

      <section className="mt-8 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Uitzonderingen</h2>
            <p className="text-sm text-muted-foreground">Komende 60 dagen.</p>
          </div>
          <Button className="gap-2" onClick={() => setExcDialog("new")}>
            <Plus className="h-4 w-4" /> Uitzondering toevoegen
          </Button>
        </div>

        {exceptions.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Geen uitzonderingen. Voeg er één toe om af te wijken van je standaard patroon.
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {exceptions.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-4 p-3">
                  <div className="flex-1">
                    <div className="font-medium">{format(new Date(e.on_date), "EEEE d MMMM", { locale: nl })}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm">
                      {e.is_available ? (
                        e.start_time && e.end_time ? (
                          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            Alleen {trimTime(e.start_time)}–{trimTime(e.end_time)}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Beschikbaar</Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                          Niet beschikbaar
                        </Badge>
                      )}
                      {e.reason && <span className="text-muted-foreground">{e.reason}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setExcDialog(e)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteException(e.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      {excDialog && (
        <ExceptionDialog
          open
          onOpenChange={(o) => !o && setExcDialog(null)}
          employeeId={myEmployeeId}
          exception={excDialog === "new" ? null : excDialog}
        />
      )}
    </>
  );
}
