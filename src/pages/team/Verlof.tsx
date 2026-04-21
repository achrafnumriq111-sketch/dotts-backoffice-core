import { useState } from "react";
import { Navigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useOrg } from "@/context/OrgContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { usePendingTimeOff, useTimeOffHistory, type TimeOffWithEmployee } from "@/hooks/useTimeOff";
import { TimeOffInboxCard } from "@/components/timeoff/TimeOffInboxCard";
import { TimeOffStatusBadge, TIME_OFF_TYPE_LABELS } from "@/components/timeoff/TimeOffStatusBadge";
import { dayCount, formatRangeNL } from "@/lib/dateNl";
import { formatDateTimeNL } from "@/lib/i18n";

function HistoryTable({ rows }: { rows: TimeOffWithEmployee[] }) {
  if (rows.length === 0) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">Geen aanvragen.</Card>;
  }
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medewerker</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Periode</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Beslist op</TableHead>
            <TableHead>Notitie</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const emp = r.employees;
            const name = emp?.display_name || `${emp?.first_name ?? ""} ${emp?.last_name ?? ""}`.trim() || "—";
            return (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  {name}
                  {emp?.positions && (
                    <Badge className="ml-2 border-0 text-[10px] text-white" style={{ backgroundColor: emp.positions.color ?? undefined }}>
                      {emp.positions.name}
                    </Badge>
                  )}
                </TableCell>
                <TableCell><Badge variant="outline">{TIME_OFF_TYPE_LABELS[r.type]}</Badge></TableCell>
                <TableCell className="text-sm">
                  {formatRangeNL(r.start_date, r.end_date)} <span className="text-muted-foreground">· {dayCount(r.start_date, r.end_date)} d</span>
                </TableCell>
                <TableCell><TimeOffStatusBadge status={r.status} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.decided_at ? formatDateTimeNL(r.decided_at) : "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.decision_note || "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

export default function TeamVerlof() {
  const { currentOrg } = useOrg();
  const { canReviewTimeOff } = useTeamPermissions();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const { data: pending = [] } = usePendingTimeOff(currentOrg?.id);
  const { data: history = [] } = useTimeOffHistory(currentOrg?.id, tab === "pending" ? "all" : tab);

  if (!canReviewTimeOff) return <Navigate to="/team" replace />;
  if (!currentOrg) return null;

  return (
    <>
      <PageHeader title="Verlof" subtitle="Beheer verlofaanvragen van je team." />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Openstaand
            {pending.length > 0 && (
              <Badge className="h-5 min-w-5 px-1.5">{pending.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Goedgekeurd</TabsTrigger>
          <TabsTrigger value="rejected">Afgewezen</TabsTrigger>
          <TabsTrigger value="all">Alle</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {pending.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">
              Geen openstaande aanvragen. 🎉
            </Card>
          ) : (
            pending.map((r) => <TimeOffInboxCard key={r.id} request={r} />)
          )}
        </TabsContent>
        <TabsContent value="approved" className="mt-4"><HistoryTable rows={history} /></TabsContent>
        <TabsContent value="rejected" className="mt-4"><HistoryTable rows={history} /></TabsContent>
        <TabsContent value="all" className="mt-4"><HistoryTable rows={history} /></TabsContent>
      </Tabs>
    </>
  );
}
