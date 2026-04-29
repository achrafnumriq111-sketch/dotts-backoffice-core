import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export interface LocationDialogRow {
  id: string;
  name: string;
  is_primary: boolean;
  is_active: boolean;
  address_street: string | null;
  address_postal_code: string | null;
  address_city: string | null;
  address_country?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  location?: LocationDialogRow | null;
  orgId: string;
  orgName?: string;
  onSaved: () => void;
}

interface FormState {
  name: string;
  address_street: string;
  address_postal_code: string;
  address_city: string;
  address_country: string;
  phone: string;
  email: string;
}

const EMPTY: FormState = {
  name: "",
  address_street: "",
  address_postal_code: "",
  address_city: "",
  address_country: "NL",
  phone: "",
  email: "",
};

const POSTAL_RE = /^\s*\d{4}\s?[A-Za-z]{2}\s*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LocationDialog({
  open,
  onOpenChange,
  mode,
  location,
  orgId,
  orgName,
  onSaved,
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && location) {
      setForm({
        name: location.name ?? "",
        address_street: location.address_street ?? "",
        address_postal_code: location.address_postal_code ?? "",
        address_city: location.address_city ?? "",
        address_country: location.address_country ?? "NL",
        phone: location.phone ?? "",
        email: location.email ?? "",
      });
    } else {
      setForm(EMPTY);
    }
    setTimeout(() => firstFieldRef.current?.focus(), 50);
  }, [open, mode, location]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = (): string | null => {
    if (!form.name.trim()) return "Naam is verplicht";
    if (form.address_postal_code.trim() && !POSTAL_RE.test(form.address_postal_code))
      return "Postcode moet 4 cijfers + 2 letters zijn (bijv. 1234 AB)";
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim()))
      return "Ongeldig e-mailadres";
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        address_street: form.address_street.trim() || null,
        address_postal_code: form.address_postal_code.trim() || null,
        address_city: form.address_city.trim() || null,
        address_country: form.address_country || "NL",
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
      };

      if (mode === "create") {
        const { error } = await supabase.from("locations").insert({
          ...payload,
          org_id: orgId,
          is_primary: false,
          is_active: true,
          timezone: "Europe/Amsterdam",
        });
        if (error) throw error;
        toast.success("Locatie aangemaakt");
      } else if (location) {
        const { error } = await supabase
          .from("locations")
          .update(payload)
          .eq("id", location.id);
        if (error) throw error;
        toast.success("Locatie opgeslagen");
      }
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      console.error("location save failed", e);
      toast.error(e?.message ?? "Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  };

  const handleMakePrimary = async () => {
    if (!location) return;
    setActing(true);
    try {
      const { error: e1 } = await supabase
        .from("locations")
        .update({ is_primary: false })
        .eq("org_id", orgId);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("locations")
        .update({ is_primary: true })
        .eq("id", location.id);
      if (e2) throw e2;
      toast.success("Hoofdlocatie ingesteld");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      console.error("set primary failed", e);
      toast.error(e?.message ?? "Hoofdlocatie instellen mislukt");
    } finally {
      setActing(false);
    }
  };

  const handleToggleActive = async () => {
    if (!location) return;
    setActing(true);
    try {
      const { error } = await supabase
        .from("locations")
        .update({ is_active: !location.is_active })
        .eq("id", location.id);
      if (error) throw error;
      toast.success(location.is_active ? "Locatie gedeactiveerd" : "Locatie geactiveerd");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      console.error("toggle active failed", e);
      toast.error(e?.message ?? "Bijwerken mislukt");
    } finally {
      setActing(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!saving) handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onKeyDown={onKeyDown}>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nieuwe locatie" : "Locatie bewerken"}
          </DialogTitle>
          <DialogDescription>
            Vul de gegevens van deze vestiging in.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="loc-name">
              Naam <span className="text-destructive">*</span>
            </Label>
            <Input
              id="loc-name"
              ref={firstFieldRef}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder={orgName ?? "Naam locatie"}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="loc-street">Straat + huisnr</Label>
            <Input
              id="loc-street"
              value={form.address_street}
              onChange={(e) => update("address_street", e.target.value)}
              placeholder="Voorbeeldstraat 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="loc-postal">Postcode</Label>
              <Input
                id="loc-postal"
                value={form.address_postal_code}
                onChange={(e) => update("address_postal_code", e.target.value)}
                placeholder="1234 AB"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="loc-city">Plaats</Label>
              <Input
                id="loc-city"
                value={form.address_city}
                onChange={(e) => update("address_city", e.target.value)}
                placeholder="Amsterdam"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="loc-country">Land</Label>
            <Select
              value={form.address_country}
              onValueChange={(v) => update("address_country", v)}
            >
              <SelectTrigger id="loc-country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NL">Nederland</SelectItem>
                <SelectItem value="BE">België</SelectItem>
                <SelectItem value="DE">Duitsland</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="loc-phone">Telefoon</Label>
              <Input
                id="loc-phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="020 1234567"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="loc-email">E-mail</Label>
              <Input
                id="loc-email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="info@voorbeeld.nl"
              />
            </div>
          </div>

          {mode === "edit" && location && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Acties</p>
                <div className="flex flex-wrap gap-2">
                  {!location.is_primary && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={acting || saving}
                      onClick={handleMakePrimary}
                    >
                      Maak hoofdlocatie
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant={location.is_active ? "destructive" : "outline"}
                    size="sm"
                    disabled={acting || saving}
                    onClick={handleToggleActive}
                  >
                    {location.is_active ? "Deactiveren" : "Activeren"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Annuleren
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
