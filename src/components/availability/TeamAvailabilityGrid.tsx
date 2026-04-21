import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useTeamAvailability, type EmployeeRowLite } from "@/hooks/useAvailability";
import { DAY_LABELS_SHORT, isoDow, toIsoDate, trimTime, weekDates } from "@/lib/dateNl";
import { TIME_OFF_TYPE_LABELS } from "@/components/timeoff/TimeOffStatusBadge";
import { cn } from "@/lib/utils";

interface Props {
  orgId: string;
  weekStart: Date;
  search: string;
  positionId: string; // "_all" or id
}

interface CellData {
  employee: EmployeeRowLite;
  date: Date;
  patterns: { start: string; end: string; available: boolean; notes: string | null }[];
  exceptions: { start: string | null; end: string | null; available: boolean; reason: string | null }[];
  timeOff: { type: string; note: string | null } | null;
}

export function TeamAvailabilityGrid({ orgId, weekStart, search, positionId }: Props) {
  const dates = weekDates(weekStart);
  const startIso = toIsoDate(dates[0]);
  const endIso = toIsoDate(dates[6]);
  const { data, isLoading } = useTeamAvailability(orgId, startIso, endIso);
  const [openCell, setOpenCell] = useState<CellData | null>(null);

  const employees = useMemo(() => {
    const all = data?.employees ?? [];
    const q = search.trim().toLowerCase();
    return all.filter((e) => {
      if (positionId !== "_all" && e.position_id !== positionId) return false;
      if (q) {
        const hay = `${e.first_name} ${e.last_name} ${e.display_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [data, search, positionId]);

  if (isLoading) {
    return <Card className="p-10 text-center text-sm text-muted-foreground">Laden…</Card>;
  }
  if (employees.length === 0) {
    return <Card className="p-10 text-center text-sm text-muted-foreground">Geen medewerkers gevonden.</Card>;
  }

  function getCell(emp: EmployeeRowLite, date: Date): CellData {
    const dow = isoDow(date);
    const iso = toIsoDate(date);
    const patterns = (data?.patterns ?? [])
      .filter((p) => p.employee_id === emp.id && p.day_of_week === dow)
      .map((p) => ({ start: trimTime(p.start_time), end: trimTime(p.end_time), available: p.is_available, notes: p.notes }));
    const exceptions = (data?.exceptions ?? [])
      .filter((e) => e.employee_id === emp.id && e.on_date === iso)
      .map((e) => ({ start: trimTime(e.start_time), end: trimTime(e.end_time), available: e.is_available, reason: e.reason }));
    const tor = (data?.timeOff ?? []).find(
      (t) => t.employee_id === emp.id && t.start_date <= iso && t.end_date >= iso,
    );
    return {
      employee: emp,
      date,
      patterns,
      exceptions,
      timeOff: tor ? { type: tor.type, note: tor.note } : null,
    };
  }

  return (
    <>
      <Card className="overflow-x-auto">
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
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b border-border last:border-0">
                <td className="sticky left-0 z-10 bg-card p-3">
                  <div className="font-medium">{emp.display_name || `${emp.first_name} ${emp.last_name}`}</div>
                  {emp.positions && (
                    <Badge className="mt-1 border-0 text-[10px] text-white" style={{ backgroundColor: emp.positions.color ?? undefined }}>
                      {emp.positions.name}
                    </Badge>
                  )}
                </td>
                {dates.map((d, i) => {
                  const cell = getCell(emp, d);
                  return (
                    <td key={i} className="p-1.5 align-top">
                      <button
                        onClick={() => setOpenCell(cell)}
                        className="flex w-full flex-col gap-1 rounded-md p-1.5 text-left text-xs transition-colors hover:bg-muted/50"
                      >
                        {cell.timeOff && (
                          <span className="rounded bg-purple-500/15 px-1.5 py-0.5 font-medium text-purple-700 dark:text-purple-400">
                            Verlof · {TIME_OFF_TYPE_LABELS[cell.timeOff.type as keyof typeof TIME_OFF_TYPE_LABELS]}
                          </span>
                        )}
                        {cell.exceptions.map((e, idx) =>
                          !e.available ? (
                            <span key={idx} className="rounded bg-destructive/15 px-1.5 py-0.5 font-medium text-destructive">
                              ✕ {e.reason || "Niet beschikbaar"}
                            </span>
                          ) : (
                            <span key={idx} className="rounded bg-amber-500/15 px-1.5 py-0.5 font-medium text-amber-700 dark:text-amber-400">
                              {e.start}–{e.end}
                            </span>
                          ),
                        )}
                        {cell.exceptions.length === 0 && !cell.timeOff && cell.patterns.map((p, idx) => (
                          <span
                            key={idx}
                            className={cn(
                              "rounded px-1.5 py-0.5 font-medium",
                              p.available
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {p.start}–{p.end}
                          </span>
                        ))}
                        {cell.patterns.length === 0 && cell.exceptions.length === 0 && !cell.timeOff && (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Sheet open={!!openCell} onOpenChange={(o) => !o && setOpenCell(null)}>
        <SheetContent>
          {openCell && (
            <>
              <SheetHeader>
                <SheetTitle>
                  {openCell.employee.display_name || `${openCell.employee.first_name} ${openCell.employee.last_name}`}
                </SheetTitle>
                <SheetDescription>{format(openCell.date, "EEEE d MMMM yyyy", { locale: nl })}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                {openCell.timeOff && (
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground">Verlof</div>
                    <p>{TIME_OFF_TYPE_LABELS[openCell.timeOff.type as keyof typeof TIME_OFF_TYPE_LABELS]}</p>
                    {openCell.timeOff.note && <p className="text-muted-foreground">"{openCell.timeOff.note}"</p>}
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Standaard patroon</div>
                  {openCell.patterns.length === 0 ? (
                    <p className="text-muted-foreground">Geen blokken</p>
                  ) : (
                    <ul className="space-y-1">
                      {openCell.patterns.map((p, i) => (
                        <li key={i}>
                          {p.start} – {p.end} {!p.available && <Badge variant="outline" className="ml-2 border-destructive/30 text-destructive">Niet beschikbaar</Badge>}
                          {p.notes && <span className="block text-xs text-muted-foreground">{p.notes}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {openCell.exceptions.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground">Uitzonderingen</div>
                    <ul className="space-y-1">
                      {openCell.exceptions.map((e, i) => (
                        <li key={i}>
                          {e.available
                            ? `${e.start} – ${e.end}`
                            : <span className="text-destructive">Niet beschikbaar</span>}
                          {e.reason && <span className="block text-xs text-muted-foreground">{e.reason}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
