import { useMemo, useState } from "react";
import { Pencil, Plus, Search, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useOrg } from "@/context/OrgContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { useEmployees } from "@/hooks/useEmployees";
import { usePositions, type Position } from "@/hooks/usePositions";
import { EmployeeCard } from "@/components/team/EmployeeCard";
import { EmployeeDialog } from "@/components/team/EmployeeDialog";
import { PositionDialog } from "@/components/team/PositionDialog";
import { PositionPermissionsTab } from "@/components/team/PositionPermissionsTab";
import { formatPriceCents } from "@/lib/eur";

type StatusFilter = "active" | "archived" | "all";

export default function Team() {
  const { currentOrg } = useOrg();
  const { canEdit, canSeeFinancial } = useTeamPermissions();
  const [tab, setTab] = useState<"employees" | "positions" | "permissions">("employees");
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("_all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [positionDialogOpen, setPositionDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);

  const { data: employees = [], isLoading: empLoading } = useEmployees(currentOrg?.id);
  const { data: positions = [], isLoading: posLoading } = usePositions(currentOrg?.id);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (statusFilter === "active" && !e.is_active) return false;
      if (statusFilter === "archived" && e.is_active) return false;
      if (positionFilter !== "_all" && e.position_id !== positionFilter) return false;
      if (q) {
        const hay = `${e.first_name} ${e.last_name} ${e.email ?? ""} ${e.phone ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [employees, search, positionFilter, statusFilter]);

  return (
    <>
      <PageHeader
        title="Team"
        subtitle="Beheer medewerkers en functies."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="employees">Medewerkers</TabsTrigger>
          {canEdit && <TabsTrigger value="positions">Functies</TabsTrigger>}
          {canEdit && <TabsTrigger value="permissions">Rechten</TabsTrigger>}
        </TabsList>

        <TabsContent value="employees" className="mt-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoek op naam, e-mail of telefoon"
                className="pl-9"
              />
            </div>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="sm:w-48"><SelectValue placeholder="Functie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Alle functies</SelectItem>
                {positions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actief</SelectItem>
                <SelectItem value="archived">Gearchiveerd</SelectItem>
                <SelectItem value="all">Alle</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="gap-2"
              disabled={!canEdit}
              onClick={() => setEmployeeDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4" /> Medewerker toevoegen
            </Button>
          </div>

          {empLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">
              {employees.length === 0
                ? "Nog geen medewerkers. Voeg je eerste medewerker toe om te beginnen."
                : "Geen medewerkers gevonden met deze filters."}
            </Card>
          ) : (
            <div className="grid gap-2">
              {filteredEmployees.map((e) => (
                <EmployeeCard key={e.id} employee={e} />
              ))}
            </div>
          )}
        </TabsContent>

        {canEdit && (
          <TabsContent value="positions" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button
                className="gap-2"
                onClick={() => { setEditingPosition(null); setPositionDialogOpen(true); }}
              >
                <Plus className="h-4 w-4" /> Functie toevoegen
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Kleur</TableHead>
                    {canSeeFinancial && <TableHead>Standaard uurloon</TableHead>}
                    <TableHead className="w-24">Sort</TableHead>
                    <TableHead className="w-20 text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posLoading ? (
                    <TableRow><TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                  ) : positions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        Nog geen functies. Voeg er één toe om medewerkers in te delen.
                      </TableCell>
                    </TableRow>
                  ) : positions.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <Badge className="border-0 text-white" style={{ backgroundColor: p.color ?? undefined }}>
                          {p.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">{p.color}</span>
                      </TableCell>
                      {canSeeFinancial && (
                        <TableCell>
                          {p.default_hourly_wage_cents != null
                            ? formatPriceCents(p.default_hourly_wage_cents)
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      )}
                      <TableCell>{p.sort_order}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingPosition(p); setPositionDialogOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        )}

        {canEdit && (
          <TabsContent value="permissions" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Bepaal per functie welke acties medewerkers in de Kassa mogen uitvoeren.
              Wijzigingen gelden direct voor alle medewerkers met deze functie.
            </p>
            <PositionPermissionsTab />
          </TabsContent>
        )}
      </Tabs>

      <EmployeeDialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen} />
      <PositionDialog
        open={positionDialogOpen}
        onOpenChange={(o) => { setPositionDialogOpen(o); if (!o) setEditingPosition(null); }}
        position={editingPosition}
      />
    </>
  );
}