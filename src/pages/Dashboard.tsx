import { ArrowUpRight, Receipt, ShoppingBag, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t, formatCurrency } from "@/lib/i18n";

export default function Dashboard() {
  const tr = t();

  const kpis = [
    {
      label: tr.dashboard.revenueToday,
      value: formatCurrency(1284.5),
      delta: "+12,4%",
      icon: Wallet,
    },
    { label: tr.dashboard.transactions, value: "47", delta: "+8", icon: Receipt },
    {
      label: tr.dashboard.avgTicket,
      value: formatCurrency(27.33),
      delta: "+3,1%",
      icon: ShoppingBag,
    },
    { label: tr.dashboard.activeStaff, value: "4", delta: "", icon: Users },
  ];

  return (
    <>
      <PageHeader title={tr.dashboard.title} subtitle={tr.dashboard.subtitle} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">{k.value}</div>
              {k.delta && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-success">
                  <ArrowUpRight className="h-3 w-3" />
                  {k.delta}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{tr.dashboard.recentSales}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            {tr.dashboard.recentSalesEmpty}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
