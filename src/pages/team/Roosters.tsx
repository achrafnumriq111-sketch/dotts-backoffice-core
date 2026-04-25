import { useMemo, useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight, Copy, Plus } from "lucide-react";
import { addWeeks, isSameDay, subWeeks } from "date-fns";
import { nl } from "date-fns/locale";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrg } from "@/context/OrgContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { useEmployees } from "@/hooks/useEmployees";
import { usePositions } from "@/hooks/usePositions";
import { useShiftsWeek } from "@/hooks/useShifts";
import { WeekGrid } from "@/components/roosters/WeekGrid";
import { CopyWeekDialog } from "@/components/roosters/CopyWeekDialog";
import { PublishWeekButton } from "@/components/roosters/PublishWeekButton";
import { formatWeekLabel, weekStart as toWeekStart } from "@/lib/dateNl";
import { cn } from "@/lib/utils";

export default function Roosters() {
  const { currentOrg, locations, currentLocation, setCurrentLocation } = useOrg();
  const { canEdit } = useTeamPermissions();
  const orgId = currentOrg?.id;
  const locationId = currentLocation?.id;

  const [weekStart, setWeekStart] = useState<Date>(toWeekStart(new Date()));
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("_all");
  const [copyOpen, setCopyOpen] = useState(false);
  const [pendingAdd, setPendingAdd] = useState<{ date: Date } | null>(null);

  const { data: employees = [] } = useEmployees(orgId);
  const activeEmployees = useMemo(() => employees.filter((e) => e.is_active), [employees]);
  const { data: positions = [] } = usePositions(orgId);
  const { data: weekData, isLoading } = useShiftsWeek(orgId, locationId, weekStart);

  const draftCount = useMemo(
    () => (weekData?.shifts ?? []).filter((s) => s.status === "draft").length,
    [weekData],
  );
  const publishedCount = useMemo(
    () => (weekData?.shifts ?? []).filter((s) => s.status === "published").length,
    [weekData],
  );
  const totalCount = (weekData?.shifts ?? []).length;

  const today = new Date();
  const thisWeekStart = toWeekStart(today);
  const isThisWeek = isSameDay(weekStart, thisWeekStart);

  function openAddInHeader() {
    // Default to today if it falls in visible week, else Monday of visible week.
    const inVisibleWeek = today >= weekStart && today < addWeeks(weekStart, 1);
    setPendingAdd({ date: inVisibleWeek ? today : weekStart });
  }

  if (!canEdit) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        Alleen eigenaren en admins kunnen roosters beheren.
      </Card>
    );
  }

  // ---------- Empty states (before grid) ----------
  if (locations.length === 0) {
    return (
      <>
        <PageHeader title="Roosters" subtitle="Plan shifts per week en publiceer voor je team." />
        <Card className="p-10 text-center">
          <h3 className="mb-2 text-lg font-semibold">Voeg eerst een locatie toe</h3>
          <p className="mb-4 text-sm text-muted-foreground">Je kunt geen diensten plannen zonder locatie.</p>
          <Button asChild><Link to="/locaties">Naar Locaties</Link></Button>
        </Card>
      </>
    );
  }

  const noEmployees = (employees ?? []).length === 0;
  if (noEmployees) {
    return (
      <>
        <PageHeader title="Roosters" subtitle="Plan shifts per week en publiceer voor je team." />
        <Card className="p-10 text-center">
          <h3 className="mb-2 text-lg font-semibold">Voeg eerst medewerkers toe</h3>
          <p className="mb-4 text-sm text-muted-foreground">Je hebt nog geen medewerkers om in te roosteren.</p>
          <Button asChild><Link to="/team">Naar Personeel</Link></Button>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Roosters" subtitle="Plan shifts per week en publiceer voor je team." />

      <Card className="mb-4 flex flex-wrap items-center gap-2 p-3">
        {locations.length > 1 && (
          <Select value={locationId ?? ""} onValueChange={setCurrentLocation}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Locatie" /></SelectTrigger>
            <SelectContent>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Week navigation pills */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekStart(subWeeks(weekStart, 1))}
            aria-label="Vorige week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={isThisWeek ? "default" : "outline"}
            size="sm"
            onClick={() => setWeekStart(thisWeekStart)}
          >
            Deze week
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            aria-label="Volgende week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("gap-2 font-normal")}>
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

        {totalCount > 0 && (
          <Badge
            variant="outline"
            className={cn(
              draftCount === 0
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            {draftCount === 0 ? "Gepubliceerd" : `Concept · ${draftCount}/${totalCount}`}
          </Badge>
        )}

        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setCopyOpen(true)} disabled={!locationId}>
            <Copy className="h-4 w-4" />
            Kopieer week…
          </Button>
          <Button className="gap-2" onClick={openAddInHeader} disabled={!locationId}>
            <Plus className="h-4 w-4" />
            Dienst
          </Button>
          {locationId && (
            <PublishWeekButton locationId={locationId} weekStart={weekStart} draftCount={draftCount} />
          )}
        </div>
      </Card>

      <Card className="mb-4 flex flex-wrap items-center gap-2 p-3">
        <Input
          placeholder="Zoek medewerker…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Alle functies</SelectItem>
            {positions.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {!locationId ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Geen actieve locatie.</Card>
      ) : isLoading ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Laden…</Card>
      ) : (
        <WeekGrid
          weekStart={weekStart}
          locationId={locationId}
          employees={activeEmployees}
          positions={positions}
          shifts={weekData?.shifts ?? []}
          patterns={weekData?.patterns ?? []}
          exceptions={weekData?.exceptions ?? []}
          timeOff={weekData?.timeOff ?? []}
          search={search}
          positionFilter={positionFilter}
          showHint={totalCount === 0}
          initialDialog={pendingAdd}
          onInitialDialogConsumed={() => setPendingAdd(null)}
        />
      )}

      {locationId && (
        <CopyWeekDialog
          open={copyOpen}
          onOpenChange={setCopyOpen}
          locationId={locationId}
          sourceWeekStart={weekStart}
        />
      )}
    </>
  );
}