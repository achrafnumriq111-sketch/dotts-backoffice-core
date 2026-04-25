import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { ShiftChip } from "./ShiftChip";
import { ShiftDialog } from "./ShiftDialog";
import { detectConflict, type EmployeeContext } from "@/lib/shiftConflicts";
import { DAY_LABELS_SHORT, toIsoDate, weekDates } from "@/lib/dateNl";
import type { ShiftRow } from "@/hooks/useShifts";
import type { Employee } from "@/hooks/useEmployees";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

const UNASSIGNED_KEY = "_unassigned";

interface Props {
  weekStart: Date;
  locationId: string;
  employees: Employee[];
  positions: Tables<"positions">[];
  shifts: ShiftRow[];
  patterns: { employee_id: string; day_of_week: number; start_time: string; end_time: string; is_available: boolean }[];
  exceptions: { employee_id: string; on_date: string; start_time: string | null; end_time: string | null; is_available: boolean }[];
  timeOff: { employee_id: string; start_date: string; end_date: string; status: string }[];
  search: string;
  positionFilter: string;
  showHint?: boolean;
  initialDialog?: { date: Date } | null;
  onInitialDialogConsumed?: () => void;
}

interface DialogState {
  open: boolean;
  date: Date;
  shift: ShiftRow | null;
  defaultEmployeeId: string | null;
}

export function WeekGrid({
  weekStart,
  locationId,
  employees,
  positions,
  shifts,
  patterns,
  exceptions,
  timeOff,
  search,
  positionFilter,
  showHint,
  initialDialog,
  onInitialDialogConsumed,
}: Props) {
  const dates = weekDates(weekStart);
  const [dialog, setDialog] = useState<DialogState>({ open: false, date: dates[0], shift: null, defaultEmployeeId: null });

  // Allow parent to trigger an "add shift" dialog (header "+ Dienst" button).
  if (initialDialog && !dialog.open) {
    // schedule open via microtask-style state update
    setDialog({ open: true, date: initialDialog.date, shift: null, defaultEmployeeId: null });
    onInitialDialogConsumed?.();
  }

  // Build per-employee context once
  const contextByEmployee = useMemo(() => {
    const map = new Map<string, EmployeeContext>();
    for (const e of employees) {
      map.set(e.id, {
        patterns: patterns.filter((p) => p.employee_id === e.id),
        exceptions: exceptions.filter((x) => x.employee_id === e.id),
        timeOff: timeOff.filter((t) => t.employee_id === e.id),
      });
    }
    return map;
  }, [employees, patterns, exceptions, timeOff]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (positionFilter !== "_all" && e.position_id !== positionFilter) return false;
      if (!q) return true;
      const hay = `${e.first_name} ${e.last_name} ${e.display_name ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [employees, search, positionFilter]);

  // Group shifts: by employee_id (or unassigned) + date
  const shiftsByCell = useMemo(() => {
    const map = new Map<string, ShiftRow[]>();
    for (const s of shifts) {
      const dateKey = toIsoDate(new Date(s.starts_at));
      const empId = s.shift_assignments?.[0]?.employee_id ?? UNASSIGNED_KEY;
      const key = `${empId}|${dateKey}`;
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return map;
  }, [shifts]);

  const openAdd = (date: Date, employeeId: string | null) => {
    setDialog({ open: true, date, shift: null, defaultEmployeeId: employeeId });
  };
  const openEdit = (date: Date, shift: ShiftRow) => {
    setDialog({ open: true, date, shift, defaultEmployeeId: null });
  };

  const renderCell = (employeeId: string | null, date: Date) => {
    const key = `${employeeId ?? UNASSIGNED_KEY}|${toIsoDate(date)}`;
    const cellShifts = shiftsByCell.get(key) ?? [];
    return (
      <div className="flex flex-col gap-1">
        {cellShifts.map((s) => {
          const conflict = employeeId ? detectConflict(s, contextByEmployee.get(employeeId)) : "none";
          return (
            <ShiftChip
              key={s.id}
              startsAt={s.starts_at}
              endsAt={s.ends_at}
              positionName={s.positions?.name}
              positionColor={s.positions?.color}
              conflict={conflict}
              status={s.status}
              unassigned={!employeeId}
              onClick={() => openEdit(date, s)}
            />
          );
        })}
        <button
          type="button"
          onClick={() => openAdd(date, employeeId)}
          className="flex items-center justify-center rounded-md border border-dashed border-border py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          aria-label="Shift toevoegen"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  // Rows = unassigned + filtered employees
  const rows: { id: string | null; label: string; subtitle?: string; color?: string | null }[] = [
    { id: null, label: "Niet toegewezen" },
    ...filteredEmployees.map((e) => ({
      id: e.id,
      label: e.display_name || `${e.first_name} ${e.last_name}`,
      subtitle: e.positions?.name,
      color: e.positions?.color,
    })),
  ];

  // Total hours per day (published vs draft)
  const totalsPerDate = useMemo(() => {
    const map = new Map<string, { published: number; draft: number }>();
    for (const d of dates) map.set(toIsoDate(d), { published: 0, draft: 0 });
    for (const s of shifts) {
      const dateKey = toIsoDate(new Date(s.starts_at));
      const bucket = map.get(dateKey);
      if (!bucket) continue;
      const ms = new Date(s.ends_at).getTime() - new Date(s.starts_at).getTime();
      const hours = Math.max(0, ms / 3_600_000 - (s.break_minutes ?? 0) / 60);
      if (s.status === "published") bucket.published += hours;
      else bucket.draft += hours;
    }
    return map;
  }, [dates, shifts]);

  function formatTotalCell(t: { published: number; draft: number }) {
    const parts: string[] = [];
    if (t.published > 0) parts.push(`${t.published.toFixed(1)}h gepubliceerd`);
    if (t.draft > 0) parts.push(`${t.draft.toFixed(1)}h concept`);
    return parts.length ? parts.join(" · ") : "—";
  }

  return (
    <>
      {/* Mobile: stacked per dag */}
      <div className="space-y-4 md:hidden">
        {dates.map((d, idx) => {
          const dayShifts = shifts.filter((s) => toIsoDate(new Date(s.starts_at)) === toIsoDate(d));
          return (
            <Card key={idx} className="p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">{DAY_LABELS_SHORT[idx]}</div>
                  <div className="font-semibold">{format(d, "d MMM", { locale: nl })}</div>
                </div>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => openAdd(d, null)}>
                  <Plus className="h-3.5 w-3.5" /> Shift
                </Button>
              </div>
              {dayShifts.length === 0 ? (
                <p className="text-xs text-muted-foreground">Geen shifts</p>
              ) : (
                <div className="space-y-1.5">
                  {dayShifts.map((s) => {
                    const empId = s.shift_assignments?.[0]?.employee_id ?? null;
                    const emp = empId ? employees.find((e) => e.id === empId) : null;
                    const conflict = empId ? detectConflict(s, contextByEmployee.get(empId)) : "none";
                    return (
                      <div key={s.id}>
                        <div className="mb-0.5 text-xs font-medium">
                          {emp ? emp.display_name || `${emp.first_name} ${emp.last_name}` : "Niet toegewezen"}
                        </div>
                        <ShiftChip
                          startsAt={s.starts_at}
                          endsAt={s.ends_at}
                          positionName={s.positions?.name}
                          positionColor={s.positions?.color}
                          conflict={conflict}
                          status={s.status}
                          unassigned={!empId}
                          onClick={() => openEdit(d, s)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Desktop/tablet: grid */}
      <Card className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="sticky left-0 z-10 min-w-[180px] bg-muted/30 p-3 text-left font-semibold">Medewerker</th>
              {dates.map((d, i) => (
                <th key={i} className="min-w-[120px] p-2 text-left font-semibold">
                  <div className="text-xs uppercase text-muted-foreground">{DAY_LABELS_SHORT[i]}</div>
                  <div>{format(d, "d MMM", { locale: nl })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showHint && (
              <tr>
                <td colSpan={1 + dates.length} className="bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                  Klik op een lege cel om een dienst toe te voegen, of kopieer een bestaande week.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id ?? "_unassigned"} className={cn("border-b border-border last:border-0", row.id === null && "bg-muted/20")}>
                <td className="sticky left-0 z-10 bg-card p-3">
                  <div className="font-medium">{row.label}</div>
                  {row.subtitle && (
                    <Badge className="mt-1 border-0 text-[10px] text-white" style={{ backgroundColor: row.color ?? undefined }}>
                      {row.subtitle}
                    </Badge>
                  )}
                </td>
                {dates.map((d, i) => (
                  <td key={i} className="p-1.5 align-top">{renderCell(row.id, d)}</td>
                ))}
              </tr>
            ))}
            <tr className="border-t-2 border-border bg-muted/30">
              <td className="sticky left-0 z-10 bg-muted/30 p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Totaal uren
              </td>
              {dates.map((d, i) => {
                const t = totalsPerDate.get(toIsoDate(d)) ?? { published: 0, draft: 0 };
                return (
                  <td key={i} className="p-2 text-right text-[11px] text-muted-foreground">
                    {formatTotalCell(t)}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </Card>

      <ShiftDialog
        open={dialog.open}
        onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}
        date={dialog.date}
        locationId={locationId}
        shift={dialog.shift}
        defaultEmployeeId={dialog.defaultEmployeeId}
        employees={employees}
        positions={positions}
        contextByEmployee={contextByEmployee}
      />
    </>
  );
}