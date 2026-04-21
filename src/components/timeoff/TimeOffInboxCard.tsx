import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { dayCount, formatRangeNL } from "@/lib/dateNl";
import { TIME_OFF_TYPE_LABELS } from "./TimeOffStatusBadge";
import type { TimeOffWithEmployee } from "@/hooks/useTimeOff";

interface Props {
  request: TimeOffWithEmployee;
}

export function TimeOffInboxCard({ request }: Props) {
  const qc = useQueryClient();
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const emp = request.employees;
  const fullName = emp?.display_name || `${emp?.first_name ?? ""} ${emp?.last_name ?? ""}`.trim() || "Onbekend";
  const days = dayCount(request.start_date, request.end_date);

  async function decide() {
    if (!decision) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc("decide_time_off", {
        p_request_id: request.id,
        p_decision: decision,
        p_decision_note: note || undefined,
      });
      if (error) throw error;
      toast.success(decision === "approved" ? "Goedgekeurd" : "Afgewezen");
      qc.invalidateQueries({ queryKey: ["pending_time_off"] });
      qc.invalidateQueries({ queryKey: ["time_off_history"] });
      qc.invalidateQueries({ queryKey: ["team_availability"] });
      qc.invalidateQueries({ queryKey: ["timeoff-pending-count"] });
      setDecision(null);
      setNote("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Niet gelukt");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{fullName}</span>
            {emp?.positions && (
              <Badge className="border-0 text-white" style={{ backgroundColor: emp.positions.color ?? undefined }}>
                {emp.positions.name}
              </Badge>
            )}
            <Badge variant="outline">{TIME_OFF_TYPE_LABELS[request.type]}</Badge>
          </div>
          <p className="text-sm">
            {formatRangeNL(request.start_date, request.end_date)} · <span className="text-muted-foreground">{days} {days === 1 ? "dag" : "dagen"}</span>
          </p>
          {request.note && <p className="text-sm text-muted-foreground">"{request.note}"</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setDecision("rejected")}>
            <X className="h-4 w-4" /> Afwijzen
          </Button>
          <Button className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setDecision("approved")}>
            <Check className="h-4 w-4" /> Goedkeuren
          </Button>
        </div>
      </Card>

      <AlertDialog open={!!decision} onOpenChange={(o) => !o && setDecision(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {decision === "approved" ? "Verlof goedkeuren?" : "Verlof afwijzen?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {fullName} · {formatRangeNL(request.start_date, request.end_date)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={decision === "rejected" ? "Reden (optioneel)" : "Notitie (optioneel)"}
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={decide} disabled={saving}>
              {saving ? "Bezig…" : decision === "approved" ? "Goedkeuren" : "Afwijzen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
