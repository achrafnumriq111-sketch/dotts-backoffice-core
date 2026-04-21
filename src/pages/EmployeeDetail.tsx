import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Archive, Pencil } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEmployee } from "@/hooks/useEmployees";
import { useEmployeePrivate, useSensitiveLog } from "@/hooks/useEmployeePrivate";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { useOrg } from "@/context/OrgContext";
import { EmployeeDialog } from "@/components/team/EmployeeDialog";
import { SensitiveField, maskBSN, maskIBAN } from "@/components/team/SensitiveField";
import { formatPriceCents } from "@/lib/eur";
import { formatDateNL, formatDateTimeNL } from "@/lib/i18n";

const EMPLOYMENT_LABELS: Record<string, string> = {
  vast: "Vast", flex: "Flex", oproep: "Oproep", stagiair: "Stagiair", zzp: "ZZP",
};

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b border-border py-2 last:border-0">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="col-span-2 text-sm">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

export default function EmployeeDetail() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { currentOrg } = useOrg();
  const { canEdit, canSeeFinancial } = useTeamPermissions();
  const { data: employee, isLoading } = useEmployee(employeeId);
  const { data: priv } = useEmployeePrivate(employeeId);
  const { data: log = [] } = useSensitiveLog(employeeId);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function handleArchive() {
    if (!employee) return;
    setArchiving(true);
    try {
      const { error } = await supabase.rpc("archive_employee", { p_employee_id: employee.id });
      if (error) throw error;
      toast.success("Medewerker gearchiveerd");
      qc.invalidateQueries({ queryKey: ["employees", currentOrg?.id] });
      qc.invalidateQueries({ queryKey: ["employee", employee.id] });
      setArchiveOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Er ging iets mis";
      toast.error(msg);
    } finally {
      setArchiving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        Medewerker niet gevonden.{" "}
        <Link to="/team" className="text-primary underline">Terug</Link>
      </Card>
    );
  }

  const positionColor = employee.positions?.color ?? "hsl(var(--muted))";

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => navigate("/team")}>
        <ArrowLeft className="h-4 w-4" /> Terug naar Team
      </Button>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback
              className="text-base font-medium text-white"
              style={{ backgroundColor: positionColor }}
            >
              {initials(employee.first_name, employee.last_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">
              {employee.first_name} {employee.last_name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              {employee.positions && (
                <Badge className="border-0 text-white" style={{ backgroundColor: employee.positions.color ?? undefined }}>
                  {employee.positions.name}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={
                  employee.is_active
                    ? "border-success/30 bg-success-muted text-success"
                    : "border-muted bg-muted text-muted-foreground"
                }
              >
                {employee.is_active ? "Actief" : "Gearchiveerd"}
              </Badge>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Bewerken
            </Button>
            {employee.is_active && (
              <Button variant="outline" className="gap-2" onClick={() => setArchiveOpen(true)}>
                <Archive className="h-4 w-4" /> Archiveren
              </Button>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profiel</TabsTrigger>
          <TabsTrigger value="contract">Contract</TabsTrigger>
          {canSeeFinancial && <TabsTrigger value="financial">Financieel</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card className="p-4">
            <FieldRow label="Voornaam" value={employee.first_name} />
            <FieldRow label="Achternaam" value={employee.last_name} />
            <FieldRow label="E-mail" value={employee.email} />
            <FieldRow label="Telefoon" value={employee.phone} />
            <FieldRow label="Functie" value={employee.positions?.name} />
            <FieldRow label="Notities" value={employee.notes} />
          </Card>
        </TabsContent>

        <TabsContent value="contract" className="mt-4">
          <Card className="p-4">
            <FieldRow label="Dienstverband" value={EMPLOYMENT_LABELS[employee.employment_type] ?? employee.employment_type} />
            <FieldRow
              label="Contract-uren per week"
              value={employee.contract_hours_per_week ? `${employee.contract_hours_per_week} u` : undefined}
            />
            <FieldRow label="Startdatum" value={employee.start_date ? formatDateNL(employee.start_date) : undefined} />
            <FieldRow label="Einddatum" value={employee.end_date ? formatDateNL(employee.end_date) : undefined} />
          </Card>
        </TabsContent>

        {canSeeFinancial && (
          <TabsContent value="financial" className="mt-4 space-y-4">
            <Card className="space-y-3 p-4">
              <SensitiveField label="BSN" value={priv?.bsn} mask={maskBSN} />
              <SensitiveField label="IBAN" value={priv?.iban} mask={maskIBAN} />
              <FieldRow label="Geboortedatum" value={priv?.birthdate ? formatDateNL(priv.birthdate) : undefined} />
              <FieldRow label="Uurloon" value={priv?.hourly_wage_cents != null ? formatPriceCents(priv.hourly_wage_cents) : undefined} />
              <FieldRow label="Noodcontact naam" value={priv?.emergency_contact_name} />
              <FieldRow label="Noodcontact telefoon" value={priv?.emergency_contact_phone} />
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 font-medium">Wijzigingsgeschiedenis</h3>
              {log.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nog geen wijzigingen.</p>
              ) : (
                <ul className="space-y-2">
                  {log.map((entry) => (
                    <li key={entry.id} className="flex items-start justify-between gap-3 border-b border-border pb-2 last:border-0">
                      <div>
                        <div className="text-sm">
                          <span className="font-medium">{entry.action}</span>
                          {entry.fields_changed && entry.fields_changed.length > 0 && (
                            <span className="text-muted-foreground"> · {entry.fields_changed.join(", ")}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{formatDateTimeNL(entry.at)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <EmployeeDialog open={editOpen} onOpenChange={setEditOpen} employee={employee} />

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Medewerker archiveren?</AlertDialogTitle>
            <AlertDialogDescription>
              {employee.first_name} {employee.last_name} wordt op niet-actief gezet.
              Je kunt deze medewerker later weer activeren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={archiving}>
              {archiving ? "Bezig…" : "Archiveren"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}