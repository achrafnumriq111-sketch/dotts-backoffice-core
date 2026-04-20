import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEUR } from "@/lib/i18n";
import { centsToInput, inputToCents } from "@/lib/eur";

interface Props {
  open: boolean;
  totalCents: number;
  submitting: boolean;
  onClose: () => void;
  onPay: (args: { method: "cash" | "pin"; cashReceivedCents: number | null; changeCents: number | null }) => void;
}

export function PaymentModal({ open, totalCents, submitting, onClose, onPay }: Props) {
  const [tab, setTab] = useState<"pin" | "cash">("pin");
  const [received, setReceived] = useState<string>("");

  useEffect(() => {
    if (open) {
      setTab("pin");
      setReceived("");
    }
  }, [open]);

  const receivedCents = useMemo(() => inputToCents(received), [received]);
  const changeCents = Math.max(0, receivedCents - totalCents);
  const canCash = receivedCents >= totalCents && totalCents > 0;

  const setPreset = (cents: number) => setReceived(centsToInput(cents));
  const exact = () => setReceived(centsToInput(totalCents));
  const roundUpFive = () => {
    const next5 = Math.ceil(totalCents / 500) * 500;
    setReceived(centsToInput(Math.max(next5, totalCents)));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !submitting) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Afrekenen</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "pin" | "cash")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pin" disabled={submitting}>PIN</TabsTrigger>
            <TabsTrigger value="cash" disabled={submitting}>Contant</TabsTrigger>
          </TabsList>

          <TabsContent value="pin" className="space-y-4 pt-2">
            <div className="rounded-lg border border-border bg-secondary/50 p-6 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Te betalen</p>
              <p className="mt-1 text-4xl font-semibold tabular-nums">{formatEUR(totalCents)}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Pas de klant via de PIN-terminal. Bevestig hieronder dat de betaling gelukt is.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
                Annuleren
              </Button>
              <Button
                className="flex-1"
                disabled={submitting || totalCents <= 0}
                onClick={() => onPay({ method: "pin", cashReceivedCents: null, changeCents: null })}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Betaling geslaagd
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="cash" className="space-y-4 pt-2">
            <div className="rounded-lg border border-border bg-secondary/50 p-6 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Te betalen</p>
              <p className="mt-1 text-4xl font-semibold tabular-nums">{formatEUR(totalCents)}</p>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={exact} disabled={submitting}>
                Exact
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={roundUpFive} disabled={submitting}>
                ↑ €5
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setPreset(1000)} disabled={submitting}>
                € 10
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setPreset(2000)} disabled={submitting}>
                € 20
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setPreset(5000)} disabled={submitting}>
                € 50
              </Button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Ontvangen bedrag</label>
              <Input
                inputMode="decimal"
                placeholder="0,00"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                disabled={submitting}
                className="text-lg tabular-nums"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm">
              <span className="text-muted-foreground">Wisselgeld</span>
              <span className="font-semibold tabular-nums">{formatEUR(changeCents)}</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
                Annuleren
              </Button>
              <Button
                className="flex-1"
                disabled={!canCash || submitting}
                onClick={() =>
                  onPay({ method: "cash", cashReceivedCents: receivedCents, changeCents })
                }
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Bevestigen
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}