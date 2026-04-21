import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { supabase } from "@/integrations/supabase/client";
import { useOrg, type OrgFull } from "@/context/OrgContext";
import { ReceiptView, type ReceiptSale } from "@/components/receipt/ReceiptView";

type FormState = {
  name: string;
  legal_name: string;
  kvk_number: string;
  vat_number: string;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  receipt_header: string;
  receipt_footer: string;
  receipt_show_logo: boolean;
  receipt_show_kvk: boolean;
  receipt_show_vat_number: boolean;
  receipt_show_address: boolean;
  receipt_show_contact: boolean;
  primary_color: string;
  logo_url: string | null;
};

const KVK_RE = /^\d{8}$/;
const VAT_RE = /^NL\d{9}B\d{2}$/i;
const POSTAL_RE = /^\d{4}\s?[A-Za-z]{2}$/;

function orgToForm(org: OrgFull | null): FormState {
  return {
    name: org?.name ?? "",
    legal_name: org?.legal_name ?? "",
    kvk_number: org?.kvk_number ?? "",
    vat_number: org?.vat_number ?? "",
    street: org?.street ?? "",
    postal_code: org?.postal_code ?? "",
    city: org?.city ?? "",
    country: org?.country ?? "NL",
    phone: org?.phone ?? "",
    email: org?.email ?? "",
    website: org?.website ?? "",
    receipt_header: org?.receipt_header ?? "",
    receipt_footer: org?.receipt_footer ?? "",
    receipt_show_logo: org?.receipt_show_logo ?? true,
    receipt_show_kvk: org?.receipt_show_kvk ?? true,
    receipt_show_vat_number: org?.receipt_show_vat_number ?? true,
    receipt_show_address: org?.receipt_show_address ?? true,
    receipt_show_contact: org?.receipt_show_contact ?? true,
    primary_color: org?.primary_color ?? "#2563EB",
    logo_url: org?.logo_url ?? null,
  };
}

const SAMPLE_SALE: ReceiptSale = {
  receipt_number: "2026-000002",
  created_at: new Date().toISOString(),
  subtotal_cents: 394,
  total_cents: 430,
  tax_by_rate: [{ rate_bps: 900, vat_cents: 36 }],
  lines: [
    {
      key: "1",
      quantity: 1,
      productName: "Cappuccino",
      variantName: "Medium",
      unitPriceCents: 430,
      lineTotalCents: 430,
      modifiers: [
        { name: "Siroop", price_cents: 20 },
        { name: "Sojamelk", price_cents: 40 },
      ],
    },
  ],
  payment: {
    method: "pin",
    amount_cents: 430,
  },
};

export default function Settings() {
  const { currentOrg, currentOrgFull, currentRole, refetchOrg } = useOrg();
  const orgId = currentOrg?.id ?? null;
  const canEdit = currentRole === "owner" || currentRole === "admin";

  const [form, setForm] = useState<FormState>(orgToForm(currentOrgFull));
  const [initialForm, setInitialForm] = useState<FormState>(orgToForm(currentOrgFull));
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const f = orgToForm(currentOrgFull);
    setForm(f);
    setInitialForm(f);
  }, [currentOrgFull]);

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  function validate(): string | null {
    if (!form.name.trim()) return "Weergavenaam is verplicht.";
    if (form.kvk_number && !KVK_RE.test(form.kvk_number))
      return "KVK-nummer moet 8 cijfers zijn.";
    if (form.vat_number && !VAT_RE.test(form.vat_number))
      return "BTW-nummer moet het formaat NL123456789B01 hebben.";
    if (form.postal_code && !POSTAL_RE.test(form.postal_code))
      return "Postcode moet het formaat 1234 AB hebben.";
    return null;
  }

  async function onSave() {
    if (!orgId) return;
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      legal_name: form.legal_name.trim() || null,
      kvk_number: form.kvk_number.trim() || null,
      vat_number: form.vat_number.trim().toUpperCase() || null,
      street: form.street.trim() || null,
      postal_code: form.postal_code.trim().toUpperCase() || null,
      city: form.city.trim() || null,
      country: form.country || "NL",
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      website: form.website.trim() || null,
      receipt_header: form.receipt_header.trim() || null,
      receipt_footer: form.receipt_footer.trim() || null,
      receipt_show_logo: form.receipt_show_logo,
      receipt_show_kvk: form.receipt_show_kvk,
      receipt_show_vat_number: form.receipt_show_vat_number,
      receipt_show_address: form.receipt_show_address,
      receipt_show_contact: form.receipt_show_contact,
      primary_color: form.primary_color,
    };

    const { error } = await supabase
      .from("organizations")
      .update(payload)
      .eq("id", orgId);
    setSaving(false);
    if (error) {
      console.error("save org failed", error);
      toast.error(error.message || "Opslaan mislukt");
      return;
    }
    toast.success("Instellingen opgeslagen");
    await refetchOrg();
  }

  function onCancel() {
    setForm(initialForm);
  }

  async function onLogoFile(file: File) {
    if (!orgId) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Bestand is te groot (max 2 MB)");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${orgId}/logo.${ext}`;
    setUploadingLogo(true);
    const { error: upErr } = await supabase.storage
      .from("org-logos")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (upErr) {
      setUploadingLogo(false);
      toast.error("Upload mislukt");
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("org-logos").getPublicUrl(path);
    const cacheBusted = `${publicUrl}?v=${Date.now()}`;
    const { error } = await supabase
      .from("organizations")
      .update({ logo_url: cacheBusted })
      .eq("id", orgId);
    setUploadingLogo(false);
    if (error) {
      toast.error("Opslaan mislukt");
      return;
    }
    set("logo_url", cacheBusted);
    setInitialForm((p) => ({ ...p, logo_url: cacheBusted }));
    await refetchOrg();
    toast.success("Logo geüpload");
  }

  async function onLogoRemove() {
    if (!orgId || !form.logo_url) return;
    setUploadingLogo(true);
    // Try to derive the storage path
    try {
      const url = new URL(form.logo_url);
      const idx = url.pathname.indexOf("/org-logos/");
      if (idx >= 0) {
        const path = url.pathname.slice(idx + "/org-logos/".length);
        await supabase.storage.from("org-logos").remove([path]);
      }
    } catch {
      // ignore
    }
    const { error } = await supabase
      .from("organizations")
      .update({ logo_url: null })
      .eq("id", orgId);
    setUploadingLogo(false);
    if (error) {
      toast.error("Verwijderen mislukt");
      return;
    }
    set("logo_url", null);
    setInitialForm((p) => ({ ...p, logo_url: null }));
    await refetchOrg();
    toast.success("Logo verwijderd");
  }

  // Build a preview org object from current form (not yet saved)
  const previewOrg: Partial<OrgFull> = useMemo(
    () => ({
      ...(currentOrgFull ?? {}),
      name: form.name,
      legal_name: form.legal_name,
      kvk_number: form.kvk_number,
      vat_number: form.vat_number,
      street: form.street,
      postal_code: form.postal_code,
      city: form.city,
      country: form.country,
      phone: form.phone,
      email: form.email,
      website: form.website,
      logo_url: form.logo_url,
      receipt_header: form.receipt_header,
      receipt_footer: form.receipt_footer,
      receipt_show_logo: form.receipt_show_logo,
      receipt_show_kvk: form.receipt_show_kvk,
      receipt_show_vat_number: form.receipt_show_vat_number,
      receipt_show_address: form.receipt_show_address,
      receipt_show_contact: form.receipt_show_contact,
      primary_color: form.primary_color,
    }),
    [form, currentOrgFull],
  );

  if (!currentOrg) {
    return (
      <>
        <PageHeader title="Instellingen" subtitle="Configureer je organisatie." />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  const disabled = !canEdit;

  return (
    <>
      <PageHeader title="Instellingen" subtitle="Configureer je organisatie." />

      {!canEdit && (
        <Alert className="mb-4">
          <AlertDescription>
            Alleen eigenaren en admins kunnen deze instellingen wijzigen.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6 pb-24">
          {/* Bedrijfsgegevens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bedrijfsgegevens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Weergavenaam *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    disabled={disabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    De naam die medewerkers zien in de app.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Juridische naam</Label>
                  <Input
                    value={form.legal_name}
                    onChange={(e) => set("legal_name", e.target.value)}
                    disabled={disabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Zoals geregistreerd bij de KVK. Wordt op bonnen getoond.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>KVK-nummer</Label>
                  <Input
                    value={form.kvk_number}
                    onChange={(e) => set("kvk_number", e.target.value.replace(/\D/g, ""))}
                    placeholder="12345678"
                    maxLength={8}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>BTW-nummer</Label>
                  <Input
                    value={form.vat_number}
                    onChange={(e) => set("vat_number", e.target.value)}
                    onBlur={(e) => set("vat_number", e.target.value.toUpperCase())}
                    placeholder="NL123456789B01"
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Adres</Label>
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr_2fr]">
                  <Input
                    value={form.street}
                    onChange={(e) => set("street", e.target.value)}
                    placeholder="Straat + huisnummer"
                    disabled={disabled}
                  />
                  <Input
                    value={form.postal_code}
                    onChange={(e) => set("postal_code", e.target.value)}
                    onBlur={(e) => set("postal_code", e.target.value.toUpperCase())}
                    placeholder="1234 AB"
                    disabled={disabled}
                  />
                  <Input
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="Plaats"
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Land</Label>
                  <Select
                    value={form.country}
                    onValueChange={(v) => set("country", v)}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NL">Nederland</SelectItem>
                      <SelectItem value="BE">België</SelectItem>
                      <SelectItem value="DE">Duitsland</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Telefoon</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+31 20 123 4567"
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Input
                    value={form.website}
                    onChange={(e) => set("website", e.target.value)}
                    placeholder="https://…"
                    disabled={disabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bon & branding */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bon &amp; branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo</Label>
                {form.logo_url ? (
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-md border border-border bg-card"
                    >
                      <img
                        src={form.logo_url}
                        alt="Logo"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onLogoRemove}
                      disabled={disabled || uploadingLogo}
                    >
                      <Trash2 className="h-4 w-4" />
                      Verwijderen
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={disabled || uploadingLogo}
                    className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-card px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Sleep een afbeelding hiernaartoe of klik om te kiezen
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.svg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onLogoFile(f);
                    e.target.value = "";
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WebP of SVG. Max 2 MB.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Kopregel op bon</Label>
                <Textarea
                  value={form.receipt_header}
                  onChange={(e) => set("receipt_header", e.target.value)}
                  rows={2}
                  placeholder="Bijv. extra adresregel, openingstijden, website"
                  disabled={disabled}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Voettekst op bon</Label>
                <Textarea
                  value={form.receipt_footer}
                  onChange={(e) => set("receipt_footer", e.target.value)}
                  rows={3}
                  placeholder="Bedankt voor uw bezoek! Tot ziens."
                  disabled={disabled}
                />
              </div>

              <div className="space-y-3">
                <Label>Wat tonen op de bon</Label>
                <ToggleRow
                  label="Logo tonen"
                  checked={form.receipt_show_logo}
                  onChange={(v) => set("receipt_show_logo", v)}
                  disabled={disabled}
                />
                <ToggleRow
                  label="KVK-nummer tonen"
                  checked={form.receipt_show_kvk}
                  onChange={(v) => set("receipt_show_kvk", v)}
                  disabled={disabled}
                />
                <ToggleRow
                  label="BTW-nummer tonen"
                  checked={form.receipt_show_vat_number}
                  onChange={(v) => set("receipt_show_vat_number", v)}
                  disabled={disabled}
                />
                <ToggleRow
                  label="Adres tonen"
                  checked={form.receipt_show_address}
                  onChange={(v) => set("receipt_show_address", v)}
                  disabled={disabled}
                />
                <ToggleRow
                  label="Contactgegevens tonen"
                  checked={form.receipt_show_contact}
                  onChange={(v) => set("receipt_show_contact", v)}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Primaire kleur</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => set("primary_color", e.target.value)}
                    disabled={disabled}
                    className="h-10 w-16 cursor-pointer rounded-md border border-border bg-card disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Input
                    value={form.primary_color}
                    onChange={(e) => set("primary_color", e.target.value)}
                    disabled={disabled}
                    className="w-32 font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="hidden lg:block">
          <div className="sticky top-4 space-y-3">
            <p className="text-sm font-medium">Voorbeeld bon</p>
            <ReceiptView org={previewOrg} sale={SAMPLE_SALE} />
          </div>
        </div>
      </div>

      {/* Sticky save bar */}
      {canEdit && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur sm:px-6 lg:pl-[calc(16rem+1.5rem)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {dirty ? "Niet opgeslagen wijzigingen" : "Alles is opgeslagen."}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={!dirty || saving}
              >
                Annuleren
              </Button>
              <Button onClick={onSave} disabled={!dirty || saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Opslaan
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
