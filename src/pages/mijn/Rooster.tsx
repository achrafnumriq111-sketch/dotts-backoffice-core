import { useMemo, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrg } from "@/context/OrgContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { useMyShifts, type MyShiftRow } from "@/hooks/useMyShifts";
import { formatWeekLabel, toIsoDate, weekStart as toWeekStart } from "@/lib/dateNl";
import { cn } from "@/lib/utils";

export default function MijnRooster() {
  const { currentOrg } = useOrg();
  const { myEmployeeId } = useTeamPermissions();
  const [mode, setMode] = useState<"week" | "upcoming">("week");
  const [weekStart, setWeekStart] = useState<Date>(toWeekStart(new Date()));

  const { data: rows = [], isLoading } = useMyShifts(myEmployeeId, weekStart, mode);

  const grouped = useMemo(() => groupByDay(rows), [rows]);

  if (!currentOrg) return null;
  if (!myEmployeeId) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        Je bent nog niet gekoppeld als medewerker. Neem contact op met je manager.
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title="Mijn rooster"
        subtitle={mode === "week" ? formatWeekLabel(weekStart) : "Komende gepubliceerde shifts"}
      />

      <Card className="mb-4 flex flex-wrap items-center gap-2 p-3">
        <Tabs value={mode} onValueChange={(v) => setMode(v as "week" | "upcoming")}>
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="upcoming">Komende</TabsTrigger>
          </TabsList>
        </Tabs>
        {mode === "week" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 font-normal">
                <CalendarIcon className="h-4 w-4" />
                {formatWeekLabel(weekStart)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={weekStart}
                onSelect={(d) => d && setWeekStart(toWeekStart(d))}
                weekStartsOn={1}
                locale={nl}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        )}
      </Card>

      {isLoading ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Laden…</Card>
      ) : grouped.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Geen gepubliceerde shifts {mode === "week" ? "deze week" : "gepland"}.
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map((g) => (
            <div key={g.date}>
              <h3 className="mb-2 text-sm font-semibold capitalize text-muted-foreground">
                {format(new Date(g.date), "EEEE d MMMM", { locale: nl })}
              </h3>
              <div className="space-y-2">
                {g.shifts.map((row) => row.shift && (
                  <Card key={row.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div
                        className="h-10 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: row.shift.positions?.color ?? "hsl(var(--muted-foreground))" }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 font-semibold">
                          {format(new Date(row.shift.starts_at), "HH:mm")} – {format(new Date(row.shift.ends_at), "HH:mm")}
                          {row.shift.break_minutes > 0 && (
                            <Badge variant="outline" className="text-[10px]">{row.shift.break_minutes} min pauze</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {[row.shift.positions?.name, row.shift.locations?.name].filter(Boolean).join(" · ")}
                        </div>
                        {row.shift.notes && <p className="mt-1 text-xs">{row.shift.notes}</p>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function groupByDay(rows: MyShiftRow[]): { date: string; shifts: MyShiftRow[] }[] {
  const map = new Map<string, MyShiftRow[]>();
  for (const r of rows) {
    if (!r.shift) continue;
    const key = toIsoDate(new Date(r.shift.starts_at));
    const arr = map.get(key) ?? [];
    arr.push(r);
    map.set(key, arr);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, shifts]) => ({ date, shifts }));
}