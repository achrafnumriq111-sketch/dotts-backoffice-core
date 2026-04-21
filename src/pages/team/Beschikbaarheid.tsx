import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Navigate } from "react-router-dom";
import { addDays } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useOrg } from "@/context/OrgContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { usePositions } from "@/hooks/usePositions";
import { TeamAvailabilityGrid } from "@/components/availability/TeamAvailabilityGrid";
import { formatWeekLabel, weekStart } from "@/lib/dateNl";

export default function TeamBeschikbaarheid() {
  const { currentOrg } = useOrg();
  const { canReviewTimeOff } = useTeamPermissions();
  const { data: positions = [] } = usePositions(currentOrg?.id);
  const [start, setStart] = useState<Date>(() => weekStart(new Date()));
  const [search, setSearch] = useState("");
  const [positionId, setPositionId] = useState("_all");

  const label = useMemo(() => formatWeekLabel(start), [start]);

  if (!canReviewTimeOff) return <Navigate to="/team" replace />;
  if (!currentOrg) return null;

  return (
    <>
      <PageHeader title="Team beschikbaarheid" subtitle="Overzicht per week van patronen, uitzonderingen en goedgekeurd verlof." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setStart((s) => addDays(s, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[220px] px-3 text-sm font-medium">{label}</div>
          <Button variant="outline" size="icon" onClick={() => setStart((s) => addDays(s, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setStart(weekStart(new Date()))}>
            Vandaag
          </Button>
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoek medewerker" className="pl-9" />
        </div>
        <Select value={positionId} onValueChange={setPositionId}>
          <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Alle functies</SelectItem>
            {positions.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TeamAvailabilityGrid orgId={currentOrg.id} weekStart={start} search={search} positionId={positionId} />
    </>
  );
}
