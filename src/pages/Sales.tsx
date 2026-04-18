import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { t, formatCurrency, formatDateTime } from "@/lib/i18n";

const SALES = [
  {
    id: "B-2026-0142",
    date: new Date(2026, 3, 18, 14, 22),
    amount: 27.5,
    method: "Pin",
    employee: "Sanne",
    status: "paid",
  },
  {
    id: "B-2026-0141",
    date: new Date(2026, 3, 18, 13, 41),
    amount: 12.9,
    method: "Cash",
    employee: "Lars",
    status: "paid",
  },
  {
    id: "B-2026-0140",
    date: new Date(2026, 3, 18, 12, 18),
    amount: 48.0,
    method: "Pin",
    employee: "Sanne",
    status: "paid",
  },
  {
    id: "B-2026-0139",
    date: new Date(2026, 3, 18, 11, 56),
    amount: 8.4,
    method: "Tikkie",
    employee: "Lars",
    status: "refunded",
  },
];

export default function Sales() {
  const tr = t();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  return (
    <>
      <PageHeader title={tr.sales.title} subtitle={tr.sales.subtitle} />

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="from" className="text-xs">
              {tr.sales.from}
            </Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to" className="text-xs">
              {tr.sales.to}
            </Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button className="sm:ml-2">{tr.sales.filter}</Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tr.sales.date}</TableHead>
              <TableHead>{tr.sales.receipt}</TableHead>
              <TableHead className="text-right">{tr.sales.amount}</TableHead>
              <TableHead>{tr.sales.method}</TableHead>
              <TableHead>{tr.sales.employee}</TableHead>
              <TableHead>{tr.common.status}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SALES.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-muted-foreground">{formatDateTime(s.date)}</TableCell>
                <TableCell className="font-medium">{s.id}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(s.amount)}</TableCell>
                <TableCell>{s.method}</TableCell>
                <TableCell>{s.employee}</TableCell>
                <TableCell>
                  {s.status === "paid" ? (
                    <Badge className="bg-success-muted text-success hover:bg-success-muted border-0">
                      Betaald
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Geretourneerd</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
