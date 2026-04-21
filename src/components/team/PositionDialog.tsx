import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/context/OrgContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { inputToCents, centsToInput } from "@/lib/eur";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Position } from "@/hooks/usePositions";

const schema = z.object({
  name: z.string().trim().min(1, "Naam is verplicht").max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Kleur moet hex zijn"),
  hourly_wage: z.string().optional(),
  sort_order: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  position?: Position | null;
}

export function PositionDialog({ open, onOpenChange, position }: Props) {
  const { currentOrg } = useOrg();
  const { canSeeFinancial } = useTeamPermissions();
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!position;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", color: "#64748B", hourly_wage: "", sort_order: "0" },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: position?.name ?? "",
      color: position?.color ?? "#64748B",
      hourly_wage: position?.default_hourly_wage_cents != null
        ? centsToInput(position.default_hourly_wage_cents) : "",
      sort_order: String(position?.sort_order ?? 0),
    });
  }, [open, position, form]);

  async function onSubmit(values: FormValues) {
    if (!currentOrg) return;
    setSubmitting(true);
    try {
      const wageCents = canSeeFinancial && values.hourly_wage
        ? inputToCents(values.hourly_wage)
        : undefined;
      const { error } = await supabase.rpc("upsert_position", {
        p_org_id: currentOrg.id,
        p_name: values.name,
        p_color: values.color,
        p_default_hourly_wage_cents: wageCents,
        p_sort_order: parseInt(values.sort_order || "0", 10) || 0,
        p_id: position?.id,
      });
      if (error) throw error;
      toast.success(isEdit ? "Functie bijgewerkt" : "Functie toegevoegd");
      qc.invalidateQueries({ queryKey: ["positions", currentOrg.id] });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Functie bewerken" : "Functie toevoegen"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="pname">Naam *</Label>
            <Input id="pname" placeholder="Bijv. Barista" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="pcolor">Kleur</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pcolor"
                  type="color"
                  className="h-10 w-16 cursor-pointer p-1"
                  {...form.register("color")}
                />
                <Input
                  className="flex-1 font-mono"
                  {...form.register("color")}
                />
              </div>
              {form.formState.errors.color && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.color.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="psort">Sort order</Label>
              <Input id="psort" type="number" {...form.register("sort_order")} />
            </div>
            {canSeeFinancial && (
              <div className="sm:col-span-2">
                <Label htmlFor="pwage">Standaard uurloon (€)</Label>
                <Input id="pwage" inputMode="decimal" placeholder="0,00" {...form.register("hourly_wage")} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Annuleren
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Bezig…" : isEdit ? "Opslaan" : "Toevoegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}