import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConflictBadge } from "./ConflictBadge";
import { detectConflict, type EmployeeContext } from "@/lib/shiftConflicts";
import { toIsoDate } from "@/lib/dateNl";
import type { ShiftRow } from "@/hooks/useShifts";
import type { Employee } from "@/hooks/useEmployees";
import type { Tables } from "@/integrations/supabase/types";

const UNASSIGNED = "_unassigned";
const NO_POSITION = "_none";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date: Date;
  locationId: string;
  shift?: ShiftRow | null;
  defaultEmployeeId?: string | null;
  employees: Employee[];
  positions: Tables<"positions">[];
  contextByEmployee: Map<string, EmployeeContext>;
}

function combine(date: Date, time: string): string {
  // returns ISO with local tz offset
  const [h, m] = time.split(":").map((x) => parseInt(x, 10));
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function pickTime(iso: string): string {
  return format(new Date(iso), "HH:mm");
}

export function ShiftDialog({
  open,
  onOpenChange,
  date,
  locationId,
  shift,
  defaultEmployeeId,
  employees,
  positions,
  contextByEmployee,
}: Props) {
  const isEdit = !!shift;
  const qc = useQueryClient();

  const initialEmployeeId =
    shift?.shift_assignments?.[0]?.employee_id ?? defaultEmployeeId ?? UNASSIGNED;
  const initialPosition = shift?.position_id ?? NO_POSITION;

  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [breakMin, setBreakMin] = useState(0);
  const [positionId, setPositionId] = useState<string>(initialPosition);
  const [employeeId, setEmployeeId] = useState<string>(initialEmployeeId);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (shift) {
      setStart(pickTime(shift.starts_at));
      setEnd(pickTime(shift.ends_at));
      setBreakMin(shift.break_minutes ?? 0);
      setPositionId(shift.position_id ?? NO_POSITION);
      setEmployeeId(shift.shift_assignments?.[0]?.employee_id ?? UNASSIGNED);
      setNotes(shift.notes ?? "");
    } else {
      setStart("09:00");
      setEnd("17:00");
      setBreakMin(0);
      setPositionId(NO_POSITION);
      setEmployeeId(defaultEmployeeId ?? UNASSIGNED);
      setNotes("");
    }
  }, [open, shift, defaultEmployeeId]);

  const conflict = useMemo(() => {
    if (employeeId === UNASSIGNED) return "none" as const;
    const ctx = contextByEmployee.get(employeeId);
    return detectConflict(
      { starts_at: combine(date, start), ends_at: combine(date, end) },
      ctx,
    );
  }, [employeeId, start, end, date, contextByEmployee]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["shifts-week"] });
    qc.invalidateQueries({ queryKey: ["my-shifts"] });
    qc.invalidateQueries({ queryKey: ["shifts-draft-count"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (end <= start) throw new Error("Eindtijd moet na starttijd liggen");
      const startsAt = combine(date, start);
      const endsAt = combine(date, end);
      const posArg = positionId === NO_POSITION ? null : positionId;

      let shiftId: string;
      let prevAssignmentId: string | null = null;

      if (isEdit && shift) {
        const { error } = await supabase.rpc("update_shift", {
          p_id: shift.id,
          p_starts_at: startsAt,
          p_ends_at: endsAt,
          p_position_id: posArg ?? undefined,
          p_break_minutes: breakMin,
          p_notes: notes || undefined,
        });
        if (error) throw error;
        shiftId = shift.id;
        prevAssignmentId = shift.shift_assignments?.[0]?.id ?? null;
      } else {
        const { data, error } = await supabase.rpc("create_shift", {
          p_location_id: locationId,
          p_starts_at: startsAt,
          p_ends_at: endsAt,
          p_position_id: posArg ?? undefined,
          p_break_minutes: breakMin,
          p_notes: notes || undefined,
        });
        if (error) throw error;
        shiftId = data as string;
      }

      const currentAssignedId = shift?.shift_assignments?.[0]?.employee_id ?? null;
      const wantAssigned = employeeId === UNASSIGNED ? null : employeeId;

      if (currentAssignedId !== wantAssigned) {
        if (prevAssignmentId) {
          const { error } = await supabase.rpc("unassign_shift", { p_assignment_id: prevAssignmentId });
          if (error) throw error;
        }
        if (wantAssigned) {
          const { error } = await supabase.rpc("assign_shift", { p_shift_id: shiftId, p_employee_id: wantAssigned });
          if (error) throw error;
        }
      } else if (!isEdit && wantAssigned) {
        const { error } = await supabase.rpc("assign_shift", { p_shift_id: shiftId, p_employee_id: wantAssigned });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success(isEdit ? "Shift bijgewerkt" : "Shift toegevoegd");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message || "Niet toegestaan"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!shift) return;
      const { error } = await supabase.rpc("delete_shift", { p_shift_id: shift.id });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Shift verwijderd");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message || "Niet toegestaan"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Shift bewerken" : "Shift toevoegen"}</DialogTitle>
          <DialogDescription>{format(date, "EEEE d MMMM yyyy", { locale: nl })}</DialogDescription>
        </DialogHeader>

        <ConflictBadge conflict={conflict} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="start">Start</Label>
            <Input id="start" type="time" step={900} value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="end">Eind</Label>
            <Input id="end" type="time" step={900} value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="break">Pauze (min)</Label>
            <Input
              id="break"
              type="number"
              min={0}
              value={breakMin}
              onChange={(e) => setBreakMin(parseInt(e.target.value || "0", 10))}
            />
          </div>
          <div>
            <Label>Functie</Label>
            <Select value={positionId} onValueChange={setPositionId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_POSITION}>Geen functie</SelectItem>
                {positions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Medewerker</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>Niet toegewezen</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.display_name || `${e.first_name} ${e.last_name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Notities</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          {isEdit ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              Verwijderen
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
            <Button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              Opslaan
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}