import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { t, formatCurrency, formatDate } from "@/lib/i18n";
import { useNotifications } from "@/context/NotificationsContext";

const INVOICES = [
  {
    id: "INV-2026-0042",
    date: new Date(2026, 3, 1),
    description: "Abonnement april 2026",
    amount: 79,
    status: "paid" as const,
  },
  {
    id: "INV-2026-0028",
    date: new Date(2026, 2, 1),
    description: "Abonnement maart 2026",
    amount: 79,
    status: "paid" as const,
  },
  {
    id: "INV-2026-0010",
    date: new Date(2026, 1, 1),
    description: "Setup-fee",
    amount: 149,
    status: "open" as const,
  },
];

function StatusBadge({ status }: { status: "paid" | "open" | "overdue" }) {
  const tr = t();
  if (status === "paid")
    return (
      <Badge className="border-0 bg-success-muted text-success hover:bg-success-muted">
        {tr.subscription.paid}
      </Badge>
    );
  if (status === "open")
    return (
      <Badge className="border-0 bg-warning-muted text-warning hover:bg-warning-muted">
        {tr.subscription.open}
      </Badge>
    );
  return <Badge variant="destructive">{tr.subscription.overdue}</Badge>;
}

export default function Subscription() {
  const tr = t();
  const { isAccountBlocked, setBlocked } = useNotifications();

  return (
    <>
      <PageHeader title={tr.subscription.title} subtitle={tr.subscription.subtitle} />

      <div className="space-y-4">
        {/* Current plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tr.subscription.currentPlan}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground">{tr.subscription.plan}</p>
                <p className="mt-1 font-medium">Pro</p>
              </div>
              <div>
                <p className="text-muted-foreground">{tr.subscription.price}</p>
                <p className="mt-1 font-medium">{formatCurrency(79)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{tr.subscription.cycle}</p>
                <p className="mt-1 font-medium">{tr.subscription.monthly}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{tr.subscription.nextBilling}</p>
                <p className="mt-1 font-medium">{formatDate(new Date(2026, 4, 1))}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{tr.subscription.contractEnd}</p>
                <p className="mt-1 font-medium">{formatDate(new Date(2027, 1, 1))}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup fee */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tr.subscription.setupFee}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{tr.subscription.amount}</p>
                <p className="mt-1 text-xl font-semibold">{formatCurrency(149)}</p>
              </div>
              <StatusBadge status="open" />
            </div>
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tr.subscription.invoices}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tr.sales.date}</TableHead>
                  <TableHead>{tr.subscription.description}</TableHead>
                  <TableHead className="text-right">{tr.subscription.amount}</TableHead>
                  <TableHead>{tr.common.status}</TableHead>
                  <TableHead className="text-right">{tr.common.download}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {INVOICES.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-muted-foreground">{formatDate(inv.date)}</TableCell>
                    <TableCell className="font-medium">
                      {inv.description}
                      <span className="ml-2 text-xs text-muted-foreground">{inv.id}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(inv.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mock toggle */}
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex flex-col">
              <Label htmlFor="block-toggle" className="text-sm font-medium">
                {tr.subscription.toggleBlocked}
              </Label>
              <span className="text-xs text-muted-foreground">
                Schakel tijdelijk de geblokkeerde-status in om de UI te testen.
              </span>
            </div>
            <Switch
              id="block-toggle"
              checked={isAccountBlocked}
              onCheckedChange={setBlocked}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
