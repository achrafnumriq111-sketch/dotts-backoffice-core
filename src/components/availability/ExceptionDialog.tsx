import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toIsoDate, trimTime } from "@/lib/dateNl";
import type { AvailabilityException } from "@/hooks/useAvailability";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  employeeId: string;
  exception?: AvailabilityException | null;
}

export function ExceptionDialog({ open, onOpenChange, employeeId, exception }: Props) {
  const qc = useQueryClient();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [available, setAvailable] = useState(false);
  const [hasTimes, setHasTimes] = useState(false);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (exception) {
      setDate(new Date(exception.on_date));
      setAvailable(exception.is_available);
      setHasTimes(!!exception.start_time && !!exception.end_time);
      setStart(trimTime(exception.start_time) || "09:00");
      setEnd(trimTime(exception.end_time) || "17:00");
      setReason(exception.reason ?? "");
    } else {
      setDate(new Date());
      setAvailable(false);
      setHasTimes(false);
      setStart("09:00");
      setEnd("17:00");
      setReason("");
    }
  }, [open, exception]);

  async function save() {
    if (!date) {
      toast.error("Kies een datum");
      return;
    }
    if (hasTimes && end <= start) {
      toast.error("Eindtijd moet na starttijd liggen");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.rpc("upsert_availability_exception", {
        p_employee_id: employeeId,
        p_on_date: toIsoDate(date),
        p_start_time: hasTimes ? `${start}:00` : undefined,
        p_end_time: hasTimes ? `${end}:00` : undefined,
        p_is_available: available,
        p_reason: reason || undefined,
        p_id: exception?.id ?? undefined,
      });
      if (error) throw error;
      toast.success(exception ? "Uitzondering bijgewerkt" : "Uitzondering toegevoegd");
      qc.invalidateQueries({ queryKey: ["availability_exceptions", employeeId] });
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
          <DialogTitle>{exception ? "Uitzondering bewerken" : "Uitzondering toevoegen"}</DialogTitle>
          <DialogDescription>Een afwijking voor één specifieke datum.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Datum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "EEEE d MMMM yyyy", { locale: nl }) : "Kies datum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label className="cursor-pointer">Beschikbaar</Label>
              <p className="text-xs text-muted-foreground">Uit = niet beschikbaar op deze dag.</p>
            </div>
            <Switch checked={available} onCheckedChange={setAvailable} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <Label className="cursor-pointer">Andere tijden</Label>
              <p className="text-xs text-muted-foreground">Aan = wijk af van het standaard patroon.</p>
            </div>
            <Switch checked={hasTimes} onCheckedChange={setHasTimes} />
          </div>
          {hasTimes && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="es">Starttijd</Label>
                <Input id="es" type="time" step={900} value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ee">Eindtijd</Label>
                <Input id="ee" type="time" step={900} value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="reason">Reden (optioneel)</Label>
            <Textarea id="reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
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
