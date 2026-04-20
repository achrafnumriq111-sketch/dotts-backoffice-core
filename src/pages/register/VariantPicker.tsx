import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatEUR } from "@/lib/i18n";
import type { CatalogProduct, CatalogVariant } from "./types";

interface Props {
  open: boolean;
  product: CatalogProduct | null;
  hasModifiersNext: boolean;
  onCancel: () => void;
  onPick: (variant: CatalogVariant) => void;
}

export function VariantPicker({ open, product, hasModifiersNext, onCancel, onPick }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!product) return null;
  const variants = [...product.variants].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const selected = variants.find((v) => v.id === selectedId) ?? null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setSelectedId(null);
          onCancel();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          {variants.map((v) => {
            const active = v.id === selectedId;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id)}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-4 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "border-border bg-card hover:border-primary/50",
                )}
              >
                <span className="text-sm font-medium">{v.name}</span>
                <span className="text-sm font-semibold text-primary">{formatEUR(v.price_cents)}</span>
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Annuleren
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              if (selected) {
                setSelectedId(null);
                onPick(selected);
              }
            }}
          >
            {hasModifiersNext ? "Volgende" : "Toevoegen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}