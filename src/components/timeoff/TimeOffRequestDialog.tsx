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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toIsoDate } from "@/lib/dateNl";
import { TIME_OFF_TYPE_LABELS } from "./TimeOffStatusBadge";
import type { Database } from "@/integrations/supabase/types";

type TimeOffType = Database["public"]["Enums"]["time_off_type"];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  employeeId: string;
}

export function TimeOffRequestDialog({ open, onOpenChange, employeeId }: Props) {
  const qc = useQueryClient();
  const [type, setType] = useState<TimeOffType>("vakantie");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType("vakantie");
    setStartDate(undefined);
    setEndDate(undefined);
    setNote("");
  }, [open]);

  async function save() {
    if (!startDate || !endDate) {
      toast.error("Kies start- en einddatum");
      return;
    }
    if (endDate < startDate) {
      toast.error("Einddatum moet na startdatum liggen");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.rpc("request_time_off", {
        p_employee_id: employeeId,
        p_type: type,
        p_start_date: toIsoDate(startDate),
        p_end_date: toIsoDate(endDate),
        p_note: note || undefined,
      });
      if (error) throw error;
      toast.success("Verlofaanvraag ingediend");
      qc.invalidateQueries({ queryKey: ["my_time_off", employeeId] });
      qc.invalidateQueries({ queryKey: ["pending_time_off"] });
      qc.invalidateQueries({ queryKey: ["timeoff-pending-count"] });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Niet gelukt");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verlof aanvragen</DialogTitle>
          <DialogDescription>Vul het type en de periode in.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as TimeOffType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TIME_OFF_TYPE_LABELS) as TimeOffType[]).map((t) => (
                  <SelectItem key={t} value={t}>{TIME_OFF_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Startdatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "d MMM yyyy", { locale: nl }) : "Kies"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Einddatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "d MMM yyyy", { locale: nl }) : "Kies"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div>
            <Label htmlFor="note">Toelichting (optioneel)</Label>
            <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Annuleren</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Bezig…" : "Aanvragen"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
