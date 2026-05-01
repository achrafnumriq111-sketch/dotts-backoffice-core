import { useState } from "react";
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
import { toast } from "sonner";
import type { SaleSuccess } from "./types";
import { ReceiptView, type ReceiptSale } from "@/components/receipt/ReceiptView";
import type { OrgFull } from "@/context/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { buildReceiptHtml } from "@/lib/buildReceiptHtml";
import { useOrg } from "@/context/OrgContext";
import { usePositionPermissions } from "@/hooks/usePositionPermissions";

interface Props {
  open: boolean;
  data: SaleSuccess | null;
  org: Partial<OrgFull> | null;
  onClose: () => void;
  onNewOrder: () => void;
}

export function ReceiptModal({ open, data, org, onClose, onNewOrder }: Props) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const { currentOrg } = useOrg();
  const { canEmailReceipt } = usePositionPermissions(currentOrg?.id);

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

  const mapEmailError = (msg: string): string => {
    if (msg.includes("unauthorized")) return "Je bent niet ingelogd.";
    if (msg.includes("forbidden")) return "Geen toegang tot deze verkoop.";
    if (msg.includes("sale_not_found")) return "Verkoop niet gevonden.";
    if (msg.includes("invalid_email")) return "Ongeldig e-mailadres.";
    if (msg.includes("brevo_failed"))
      return "E-mail versturen mislukt. Probeer opnieuw.";
    if (
      msg.includes("html_required") ||
      msg.includes("subject_required") ||
      msg.includes("sale_id_required")
    ) {
      return "Er ging iets mis bij het opmaken van de bon.";
    }
    return msg;
  };

  const handleSendEmail = async () => {
    const email = emailValue.trim();
    if (!email.includes("@")) {
      toast.error("Ongeldig e-mailadres.");
      return;
    }
    setEmailSubmitting(true);
    const { data: resp, error } = await supabase.functions.invoke("email-receipt", {
      body: {
        sale_id: data.sale_id,
        recipient_email: email,
      },
    });
    setEmailSubmitting(false);
    if (error) {
      const errMsg =
        (resp as { error?: string } | null)?.error ?? error.message ?? "unknown_error";
      toast.error(mapEmailError(errMsg));
      return;
    }
    if (resp && typeof resp === "object" && "error" in resp && resp.error) {
      toast.error(mapEmailError(String(resp.error)));
      return;
    }
    toast.success(`Bon verzonden naar ${email}`);
    setEmailOpen(false);
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
          {canEmailReceipt && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setEmailValue("");
                setEmailOpen(true);
              }}
            >
              Mail bon
            </Button>
          )}
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Sluiten
          </Button>
          <Button className="flex-1" onClick={onNewOrder}>
            Nieuwe bestelling
          </Button>
        </div>

        <Dialog
          open={emailOpen}
          onOpenChange={(o) => !emailSubmitting && setEmailOpen(o)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bon mailen</DialogTitle>
              <DialogDescription>
                Vul het e-mailadres in waar de bon naartoe verstuurd moet worden.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="receipt-email-recipient">E-mailadres ontvanger</Label>
              <Input
                id="receipt-email-recipient"
                type="email"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                placeholder="naam@voorbeeld.nl"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEmailOpen(false)}
                disabled={emailSubmitting}
              >
                Annuleren
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={!emailValue.trim().includes("@") || emailSubmitting}
              >
                {emailSubmitting ? "Bezig…" : "Verstuur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}