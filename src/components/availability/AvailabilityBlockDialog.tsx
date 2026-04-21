import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DAY_LABELS_LONG, trimTime } from "@/lib/dateNl";
import type { AvailabilityPattern } from "@/hooks/useAvailability";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  employeeId: string;
  dayIso: number; // 1..7
  pattern?: AvailabilityPattern | null;
}

export function AvailabilityBlockDialog({ open, onOpenChange, employeeId, dayIso, pattern }: Props) {
  const qc = useQueryClient();
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [available, setAvailable] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStart(trimTime(pattern?.start_time) || "09:00");
    setEnd(trimTime(pattern?.end_time) || "17:00");
    setAvailable(pattern?.is_available ?? true);
    setNotes(pattern?.notes ?? "");
  }, [open, pattern]);

  async function save() {
    if (end <= start) {
      toast.error("Eindtijd moet na starttijd liggen");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.rpc("upsert_availability_pattern", {
        p_employee_id: employeeId,
        p_day_of_week: dayIso,
        p_start_time: `${start}:00`,
        p_end_time: `${end}:00`,
        p_is_available: available,
        p_notes: notes || undefined,
        p_id: pattern?.id ?? undefined,
      });
      if (error) throw error;
      toast.success(pattern ? "Blok bijgewerkt" : "Blok toegevoegd");
      qc.invalidateQueries({ queryKey: ["availability_patterns", employeeId] });
      qc.invalidateQueries({ queryKey: ["team_availability"] });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Niet toegestaan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pattern ? "Blok bewerken" : "Blok toevoegen"}</DialogTitle>
          <DialogDescription>{DAY_LABELS_LONG[dayIso - 1]}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start">Starttijd</Label>
              <Input id="start" type="time" step={900} value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="end">Eindtijd</Label>
              <Input id="end" type="time" step={900} value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label className="cursor-pointer">Beschikbaar</Label>
              <p className="text-xs text-muted-foreground">
                Zet uit om aan te geven dat je in dit blok niet beschikbaar bent.
              </p>
            </div>
            <Switch checked={available} onCheckedChange={setAvailable} />
          </div>
          <div>
            <Label htmlFor="notes">Notitie (optioneel)</Label>
            <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Annuleren</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Bezig…" : "Opslaan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
