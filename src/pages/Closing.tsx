import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t, formatCurrency } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function Closing() {
  const tr = t();
  const [opening, setOpening] = useState("100.00");
  const [closing, setClosing] = useState("");
  const salesTotal = 1284.5;

  const expected = useMemo(() => Number(opening || 0) + salesTotal, [opening]);
  const diff = useMemo(() => Number(closing || 0) - expected, [closing, expected]);

  return (
    <>
      <PageHeader title={tr.closing.title} subtitle={tr.closing.subtitle} />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tr.closing.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="open">{tr.closing.opening} (€)</Label>
                <Input
                  id="open"
                  type="number"
                  step="0.01"
                  value={opening}
                  onChange={(e) => setOpening(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{tr.closing.salesTotal}</Label>
                <Input value={formatCurrency(salesTotal)} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="close">{tr.closing.closing} (€)</Label>
                <Input
                  id="close"
                  type="number"
                  step="0.01"
                  value={closing}
                  onChange={(e) => setClosing(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{tr.closing.difference}</Label>
                <Input
                  value={closing ? formatCurrency(diff) : "—"}
                  readOnly
                  className={cn(
                    "bg-muted",
                    closing && diff < 0 && "text-destructive",
                    closing && diff > 0 && "text-success",
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{tr.closing.notes}</Label>
              <Textarea id="notes" rows={4} placeholder="Opmerkingen voor de eigenaar…" />
            </div>

            <div className="flex justify-end">
              <Button size="lg">{tr.closing.submit}</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Samenvatting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tr.closing.opening}</span>
              <span className="tabular-nums">{formatCurrency(Number(opening || 0))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tr.closing.salesTotal}</span>
              <span className="tabular-nums">{formatCurrency(salesTotal)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-medium">
              <span>Verwacht</span>
              <span className="tabular-nums">{formatCurrency(expected)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
