import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, ChevronRight, ShieldAlert, Upload, FileText, X, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/context/OrgContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { usePositions } from "@/hooks/usePositions";
import { useEmployeePrivate } from "@/hooks/useEmployeePrivate";
import { inputToCents, centsToInput } from "@/lib/eur";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Employee } from "@/hooks/useEmployees";
import { AccountLinkSection } from "./AccountLinkSection";

const EMPLOYMENT_TYPES = ["vast", "flex", "oproep"] as const;
const EMPLOYMENT_LABELS: Record<string, string> = {
  vast: "Vast", flex: "Tijdelijk", oproep: "Oproep",
};

const MAX_CONTRACT_BYTES = 10 * 1024 * 1024; // 10 MB

const schema = z.object({
  first_name: z.string().trim().min(1, "Voornaam is verplicht").max(100),
  last_name: z.string().trim().min(1, "Achternaam is verplicht").max(100),
  email: z.string().trim().email("Ongeldig e-mailadres").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  position_id: z.string().optional(),
  employment_type: z.enum(EMPLOYMENT_TYPES),
  contract_hours_per_week: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
  // sensitive
  bsn: z.string().trim().max(20).optional().or(z.literal("")),
  iban: z.string().trim().max(40).optional().or(z.literal("")),
  birthdate: z.string().optional(),
  hourly_wage: z.string().optional(),
  emergency_contact_name: z.string().trim().max(120).optional().or(z.literal("")),
  emergency_contact_phone: z.string().trim().max(50).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  employee?: Employee | null;
}

export function EmployeeDialog({ open, onOpenChange, employee }: Props) {
  const { currentOrg } = useOrg();
  const { canSeeFinancial } = useTeamPermissions();
  const { data: positions = [] } = usePositions(currentOrg?.id);
  const { data: priv } = useEmployeePrivate(employee?.id);
  const qc = useQueryClient();
  const [showSensitive, setShowSensitive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [contractCleared, setContractCleared] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isEdit = !!employee;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "", last_name: "", email: "", phone: "",
      position_id: "", employment_type: "flex",
      contract_hours_per_week: "", start_date: "", end_date: "", notes: "",
      bsn: "", iban: "", birthdate: "", hourly_wage: "",
      emergency_contact_name: "", emergency_contact_phone: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    const existingType = (employee?.employment_type as string) ?? "flex";
    const mappedType = (EMPLOYMENT_TYPES as readonly string[]).includes(existingType)
      ? (existingType as typeof EMPLOYMENT_TYPES[number])
      : "flex";
    form.reset({
      first_name: employee?.first_name ?? "",
      last_name: employee?.last_name ?? "",
      email: employee?.email ?? "",
      phone: employee?.phone ?? "",
      position_id: employee?.position_id ?? "",
      employment_type: mappedType,
      contract_hours_per_week: employee?.contract_hours_per_week
        ? String(employee.contract_hours_per_week).replace(".", ",")
        : "",
      start_date: employee?.start_date ?? "",
      end_date: employee?.end_date ?? "",
      notes: employee?.notes ?? "",
      bsn: priv?.bsn ?? "",
      iban: priv?.iban ?? "",
      birthdate: priv?.birthdate ?? "",
      hourly_wage: priv?.hourly_wage_cents != null ? centsToInput(priv.hourly_wage_cents) : "",
      emergency_contact_name: priv?.emergency_contact_name ?? "",
      emergency_contact_phone: priv?.emergency_contact_phone ?? "",
    });
    setShowSensitive(false);
    setContractFile(null);
    setContractCleared(false);
    setDownloadUrl(null);
  }, [open, employee, priv, form]);

  // Generate signed URL for existing contract.
  useEffect(() => {
    let cancelled = false;
    async function loadUrl() {
      const path = employee?.contract_file_url;
      if (!open || !path || contractCleared) {
        setDownloadUrl(null);
        return;
      }
      const { data } = await supabase.storage.from("contracts").createSignedUrl(path, 60 * 10);
      if (!cancelled) setDownloadUrl(data?.signedUrl ?? null);
    }
    loadUrl();
    return () => { cancelled = true; };
  }, [open, employee?.contract_file_url, contractCleared]);

  function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Alleen PDF-bestanden zijn toegestaan.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_CONTRACT_BYTES) {
      toast.error("Bestand is te groot (max. 10 MB).");
      e.target.value = "";
      return;
    }
    setContractFile(file);
    setContractCleared(false);
  }

  function clearContract() {
    setContractFile(null);
    setContractCleared(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadContract(orgId: string, employeeId: string, file: File): Promise<{ path: string; name: string }> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${orgId}/${employeeId}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("contracts").upload(path, file, {
      contentType: "application/pdf",
      upsert: false,
    });
    if (error) throw error;
    return { path, name: file.name };
  }

  async function onSubmit(values: FormValues) {
    if (!currentOrg) return;
    setSubmitting(true);
    try {
      const hours = values.contract_hours_per_week
        ? parseFloat(values.contract_hours_per_week.replace(",", "."))
        : undefined;
      const wageCents = canSeeFinancial && values.hourly_wage
        ? inputToCents(values.hourly_wage)
        : undefined;

      if (isEdit && employee) {
        let contractUrl: string | undefined;
        let contractName: string | undefined;
        if (contractFile) {
          setUploading(true);
          const uploaded = await uploadContract(currentOrg.id, employee.id, contractFile);
          setUploading(false);
          contractUrl = uploaded.path;
          contractName = uploaded.name;
        }

        const { error: e1 } = await supabase.rpc("update_employee", {
          p_employee_id: employee.id,
          p_first_name: values.first_name,
          p_last_name: values.last_name,
          p_email: values.email || undefined,
          p_phone: values.phone || undefined,
          p_position_id: values.position_id || undefined,
          p_employment_type: values.employment_type,
          p_contract_hours_per_week: hours,
          p_start_date: values.start_date || undefined,
          p_end_date: values.end_date || undefined,
          p_notes: values.notes || undefined,
          p_contract_file_url: contractUrl,
          p_contract_file_name: contractName,
          p_clear_contract: contractCleared && !contractFile,
        });
        if (e1) throw e1;

        if (canSeeFinancial && (
          values.bsn || values.iban || values.birthdate || values.hourly_wage ||
          values.emergency_contact_name || values.emergency_contact_phone
        )) {
          const { error: e2 } = await supabase.rpc("update_employee_sensitive", {
            p_employee_id: employee.id,
            p_bsn: values.bsn || undefined,
            p_iban: values.iban || undefined,
            p_birthdate: values.birthdate || undefined,
            p_hourly_wage_cents: wageCents,
            p_emergency_contact_name: values.emergency_contact_name || undefined,
            p_emergency_contact_phone: values.emergency_contact_phone || undefined,
          });
          if (e2) throw e2;
        }
        toast.success("Medewerker bijgewerkt");
      } else {
        const { data: newId, error } = await supabase.rpc("add_employee", {
          p_org_id: currentOrg.id,
          p_first_name: values.first_name,
          p_last_name: values.last_name,
          p_email: values.email || undefined,
          p_phone: values.phone || undefined,
          p_position_id: values.position_id || undefined,
          p_employment_type: values.employment_type,
          p_contract_hours_per_week: hours,
          p_start_date: values.start_date || undefined,
          p_end_date: values.end_date || undefined,
          p_notes: values.notes || undefined,
          ...(canSeeFinancial
            ? {
                p_bsn: values.bsn || undefined,
                p_iban: values.iban || undefined,
                p_birthdate: values.birthdate || undefined,
                p_hourly_wage_cents: wageCents,
                p_emergency_contact_name: values.emergency_contact_name || undefined,
                p_emergency_contact_phone: values.emergency_contact_phone || undefined,
              }
            : {}),
        });
        if (error) throw error;

        // After creation, upload contract if present and patch the row.
        if (contractFile && newId) {
          setUploading(true);
          try {
            const uploaded = await uploadContract(currentOrg.id, newId as unknown as string, contractFile);
            const { error: upErr } = await supabase.rpc("update_employee", {
              p_employee_id: newId as unknown as string,
              p_contract_file_url: uploaded.path,
              p_contract_file_name: uploaded.name,
            });
            if (upErr) throw upErr;
          } finally {
            setUploading(false);
          }
        }
        toast.success("Medewerker toegevoegd");
      }
      qc.invalidateQueries({ queryKey: ["employees", currentOrg.id] });
      if (employee) {
        qc.invalidateQueries({ queryKey: ["employee", employee.id] });
        qc.invalidateQueries({ queryKey: ["employee_private", employee.id] });
        qc.invalidateQueries({ queryKey: ["sensitive_log", employee.id] });
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Er ging iets mis";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Medewerker bewerken" : "Medewerker toevoegen"}</DialogTitle>
          <DialogDescription>Vul de gegevens van de medewerker in.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="first_name">Voornaam *</Label>
              <Input id="first_name" {...form.register("first_name")} />
              {form.formState.errors.first_name && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.first_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="last_name">Achternaam *</Label>
              <Input id="last_name" {...form.register("last_name")} />
              {form.formState.errors.last_name && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.last_name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Telefoon</Label>
              <Input id="phone" {...form.register("phone")} />
            </div>
            <div>
              <Label>Functie</Label>
              <Select
                value={form.watch("position_id") || "_none"}
                onValueChange={(v) => form.setValue("position_id", v === "_none" ? "" : v)}
              >
                <SelectTrigger><SelectValue placeholder="Geen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Geen</SelectItem>
                  {positions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dienstverband</Label>
              <Select
                value={form.watch("employment_type")}
                onValueChange={(v) => form.setValue("employment_type", v as typeof EMPLOYMENT_TYPES[number])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{EMPLOYMENT_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contract_hours_per_week">Contract-uren per week</Label>
              <Input id="contract_hours_per_week" inputMode="decimal" placeholder="32" {...form.register("contract_hours_per_week")} />
            </div>
            <div>
              <Label htmlFor="start_date">Startdatum</Label>
              <Input id="start_date" type="date" {...form.register("start_date")} />
            </div>
            <div>
              <Label htmlFor="end_date">Einddatum</Label>
              <Input id="end_date" type="date" {...form.register("end_date")} />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notities</Label>
            <Textarea id="notes" rows={3} {...form.register("notes")} />
          </div>

          <div className="space-y-2">
            <Label>Contract (PDF)</Label>
            {contractFile ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{contractFile.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    ({(contractFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={clearContract}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : employee?.contract_file_url && !contractCleared ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{employee.contract_file_name ?? "contract.pdf"}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {downloadUrl && (
                    <Button type="button" size="sm" variant="ghost" asChild>
                      <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button type="button" size="sm" variant="ghost" onClick={clearContract}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                PDF kiezen…
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handlePickFile}
            />
            <p className="text-xs text-muted-foreground">Max. 10 MB. Alleen PDF.</p>
          </div>

          {canSeeFinancial && (
            <div className="rounded-md border border-border">
              <button
                type="button"
                onClick={() => setShowSensitive((s) => !s)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <ShieldAlert className="h-4 w-4 text-warning" />
                  Gevoelige gegevens
                </span>
                {showSensitive ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {showSensitive && (
                <div className="space-y-4 border-t border-border p-4">
                  <p className="text-xs text-muted-foreground">
                    Deze velden zijn alleen zichtbaar voor eigenaren. Wijzigingen worden gelogd.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="bsn">BSN</Label>
                      <Input id="bsn" {...form.register("bsn")} />
                    </div>
                    <div>
                      <Label htmlFor="iban">IBAN</Label>
                      <Input id="iban" {...form.register("iban")} />
                    </div>
                    <div>
                      <Label htmlFor="birthdate">Geboortedatum</Label>
                      <Input id="birthdate" type="date" {...form.register("birthdate")} />
                    </div>
                    <div>
                      <Label htmlFor="hourly_wage">Uurloon (€)</Label>
                      <Input id="hourly_wage" inputMode="decimal" placeholder="0,00" {...form.register("hourly_wage")} />
                    </div>
                    <div>
                      <Label htmlFor="emergency_contact_name">Noodcontact naam</Label>
                      <Input id="emergency_contact_name" {...form.register("emergency_contact_name")} />
                    </div>
                    <div>
                      <Label htmlFor="emergency_contact_phone">Noodcontact telefoon</Label>
                      <Input id="emergency_contact_phone" {...form.register("emergency_contact_phone")} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {isEdit && employee && (
            <AccountLinkSection employee={employee} />
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Annuleren
            </Button>
            <Button type="submit" disabled={submitting || uploading}>
              {uploading ? "Uploaden…" : submitting ? "Bezig…" : isEdit ? "Opslaan" : "Toevoegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}