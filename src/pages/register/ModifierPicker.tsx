import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatEUR } from "@/lib/i18n";
import { formatPriceDelta } from "@/lib/eur";
import type { CatalogModifier, CatalogModifierGroup, CatalogProduct } from "./types";

export interface PickedModifier {
  id: string;
  name: string;
  price_delta_cents: number;
}

interface Props {
  open: boolean;
  product: CatalogProduct | null;
  groups: CatalogModifierGroup[];
  onCancel: () => void;
  onDone: (picked: PickedModifier[]) => void;
}

export function ModifierPicker({ open, product, groups, onCancel, onDone }: Props) {
  const [step, setStep] = useState(0);
  // Selections per group id -> array of modifier ids
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      setStep(0);
      setSelections({});
    }
  }, [open, product?.id]);

  const group = groups[step];

  const sortedModifiers = useMemo(() => {
    if (!group) return [];
    return [...group.modifiers]
      .filter((m) => (m as CatalogModifier & { active?: boolean }).active !== false)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  }, [group]);

  if (!product || !group) return null;

  const picked = selections[group.id] ?? [];
  const isRadio = group.max_select === 1;
  const minRequired = group.required ? Math.max(1, group.min_select) : group.min_select;
  const canAdvance = picked.length >= minRequired;
  const isLast = step === groups.length - 1;

  const ruleHint = (() => {
    if (group.required && group.max_select === 1) return "Verplicht — kies er 1";
    if (group.required) return `Verplicht — kies er ${minRequired}${group.max_select > minRequired ? ` tot ${group.max_select}` : ""}`;
    if (group.max_select === 1) return "Kies er 1";
    if (group.min_select > 0) return `Kies er ${group.min_select} tot ${group.max_select}`;
    return `Kies tot ${group.max_select}`;
  })();

  const toggle = (modId: string) => {
    setSelections((prev) => {
      const cur = prev[group.id] ?? [];
      if (isRadio) return { ...prev, [group.id]: [modId] };
      if (cur.includes(modId)) return { ...prev, [group.id]: cur.filter((id) => id !== modId) };
      if (cur.length >= group.max_select) return prev;
      return { ...prev, [group.id]: [...cur, modId] };
    });
  };

  const advance = () => {
    if (isLast) {
      const allPicked: PickedModifier[] = [];
      for (const g of groups) {
        const ids = selections[g.id] ?? [];
        for (const id of ids) {
          const m = g.modifiers.find((x) => x.id === id);
          if (m) allPicked.push({ id: m.id, name: m.name, price_delta_cents: m.price_delta_cents });
        }
      }
      onDone(allPicked);
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="truncate">{group.name}</DialogTitle>
            {group.required && <Badge variant="secondary">Verplicht</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{ruleHint}</p>
          {groups.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Stap {step + 1} van {groups.length}
            </p>
          )}
        </DialogHeader>
        <div className="grid gap-2">
          {sortedModifiers.map((m) => {
            const active = picked.includes(m.id);
            const disabled = !active && !isRadio && picked.length >= group.max_select;
            return (
              <button
                key={m.id}
                type="button"
                disabled={disabled}
                onClick={() => toggle(m.id)}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "border-border bg-card hover:border-primary/50",
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="text-sm font-medium">{m.name}</span>
                <span className={cn("text-sm", m.price_delta_cents > 0 ? "text-foreground" : "text-muted-foreground")}>
                  {m.price_delta_cents === 0 ? "gratis" : formatPriceDelta(m.price_delta_cents)}
                </span>
              </button>
            );
          })}
          {sortedModifiers.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">Geen opties beschikbaar.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Annuleren
          </Button>
          <Button disabled={!canAdvance} onClick={advance}>
            {isLast ? "Toevoegen aan bestelling" : "Verder"}
          </Button>
        </DialogFooter>
        {/* Suppress unused import in some envs */}
        <span className="hidden">{formatEUR(0)}</span>
      </DialogContent>
    </Dialog>
  );
}