import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatEUR } from "@/lib/i18n";
import { formatPriceDelta } from "@/lib/eur";
import type { SaleSuccess } from "./types";

interface Props {
  open: boolean;
  data: SaleSuccess | null;
  orgName: string | null;
  onClose: () => void;
  onNewOrder: () => void;
}

function formatDateTimeNL(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function ReceiptModal({ open, data, orgName, onClose, onNewOrder }: Props) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bon {data.receipt_number}</DialogTitle>
        </DialogHeader>

        <div className="rounded-md border border-border bg-card p-4 font-mono text-xs">
          {orgName && <p className="text-center text-sm font-semibold">{orgName}</p>}
          <p className="mt-1 text-center text-muted-foreground">{formatDateTimeNL(data.createdAt)}</p>

          <div className="my-3 border-t border-dashed border-border" />

          <ul className="space-y-2">
            {data.cart.map((line) => {
              const baseUnit = line.unitPriceCents - line.modifiers.reduce((s, m) => s + m.price_cents, 0);
              return (
                <li key={line.clientId}>
                  <div className="flex justify-between gap-2">
                    <span className="truncate">
                      {line.quantity}× {line.productName}
                      {line.variantName ? ` · ${line.variantName}` : ""}
                    </span>
                    <span className="tabular-nums">{formatEUR(baseUnit)}</span>
                  </div>
                  {line.modifiers.map((m, i) => (
                    <div key={i} className="flex justify-between gap-2 pl-4 text-muted-foreground">
                      <span className="truncate">{m.name}</span>
                      <span className="tabular-nums">
                        {m.price_cents === 0 ? "gratis" : formatPriceDelta(m.price_cents)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-end pt-0.5">
                    <span className="tabular-nums font-semibold">
                      {formatEUR(line.unitPriceCents * line.quantity)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="my-3 border-t border-dashed border-border" />

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotaal (excl. BTW)</span>
              <span className="tabular-nums">{formatEUR(data.subtotalCents)}</span>
            </div>
            {data.taxByRate.map((t) => (
              <div key={t.rateBps} className="flex justify-between">
                <span className="text-muted-foreground">BTW {(t.rateBps / 100).toFixed(0)}%</span>
                <span className="tabular-nums">{formatEUR(t.vatCents)}</span>
              </div>
            ))}
          </div>

          <div className="my-2 border-t-2 border-foreground" />

          <div className="flex justify-between text-sm font-bold">
            <span>Totaal</span>
            <span className="tabular-nums">{formatEUR(data.totalCents)}</span>
          </div>

          <div className="my-3 border-t border-dashed border-border" />

          {data.method === "cash" ? (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contant ontvangen</span>
                <span className="tabular-nums">{formatEUR(data.cashReceivedCents ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wisselgeld</span>
                <span className="tabular-nums">{formatEUR(data.changeCents ?? 0)}</span>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Betaald met PIN</p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => toast.message("Deze functie komt binnenkort.")}
          >
            Mail bon
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Sluiten
          </Button>
          <Button className="flex-1" onClick={onNewOrder}>
            Nieuwe bestelling
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}