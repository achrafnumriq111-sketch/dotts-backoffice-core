import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { SaleSuccess } from "./types";
import { ReceiptView, type ReceiptSale } from "@/components/receipt/ReceiptView";
import type { OrgFull } from "@/context/OrgContext";

interface Props {
  open: boolean;
  data: SaleSuccess | null;
  org: Partial<OrgFull> | null;
  onClose: () => void;
  onNewOrder: () => void;
}

export function ReceiptModal({ open, data, org, onClose, onNewOrder }: Props) {
  if (!data) return null;

  const sale: ReceiptSale = {
    receipt_number: data.receipt_number,
    created_at: data.createdAt,
    subtotal_cents: data.subtotalCents,
    total_cents: data.totalCents,
    tax_by_rate: data.taxByRate.map((t) => ({ rate_bps: t.rateBps, vat_cents: t.vatCents })),
    lines: data.cart.map((line) => ({
      key: line.clientId,
      quantity: line.quantity,
      productName: line.productName,
      variantName: line.variantName,
      unitPriceCents: line.unitPriceCents,
      lineTotalCents: line.unitPriceCents * line.quantity,
      modifiers: line.modifiers,
    })),
    payment: {
      method: data.method,
      amount_cents: data.totalCents,
      tendered_cents: data.cashReceivedCents,
      change_cents: data.changeCents,
    },
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bon {data.receipt_number}</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center">
          <ReceiptView org={org} sale={sale} className="w-full" />
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