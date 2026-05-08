import { Link } from "react-router-dom";
import {
  Building2,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminOverview } from "@/hooks/useAdminDashboard";

function eur(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
}

const SUB_STATUS: Record<string, { label: string; class: string }> = {
  active: { label: "Actief", class: "bg-green-100 text-green-700" },
  past_due: { label: "Achterstallig", class: "bg-red-100 text-red-700" },
  paused: { label: "Gepauzeerd", class: "bg-yellow-100 text-yellow-700" },
  canceled: { label: "Beëindigd", class: "bg-gray-100 text-gray-500" },
  pending_setup: { label: "Setup vereist", class: "bg-orange-100 text-orange-700" },
};

export default function SuperAdminOverview() {
  const { data, isLoading, error } = useAdminOverview();

  const kpis = [
    {
      label: "Totaal klanten",
      value: isLoading ? null : (data?.totalOrgs ?? 0),
      icon: Building2,
      color: "text-blue-600",
    },
    {
      label: "Actieve abonnementen",
      value: isLoading ? null : (data?.activeSubscriptions ?? 0),
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      label: "MRR",
      value: isLoading ? null : eur(data?.mrrCents ?? 0),
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      label: "Nieuwe klanten (mnd)",
      value: isLoading ? null : (data?.newOrgsThisMonth ?? 0),
      icon: CreditCard,
      color: "text-indigo-600",
    },
    {
      label: "Openstaande facturen",
      value: isLoading ? null : (data?.overdueInvoices ?? 0),
      icon: AlertTriangle,
      color: data?.overdueInvoices ? "text-red-600" : "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overzicht</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dotts platform — live metrics
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Fout bij laden: {String(error)}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {k.label}
              </CardTitle>
              <k.icon className={`h-4 w-4 ${k.color}`} />
            </CardHeader>
            <CardContent>
              {k.value === null ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <div className="text-2xl font-semibold">{k.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent signups */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recente aanmeldingen</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/superadmin/clients">
              Alle klanten
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (data?.recentOrgs ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen organisaties gevonden.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(data?.recentOrgs ?? []).map((org) => {
                const status = org.subscription_status
                  ? (SUB_STATUS[org.subscription_status] ?? {
                      label: org.subscription_status,
                      class: "bg-gray-100 text-gray-500",
                    })
                  : null;
                return (
                  <li key={org.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {org.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <Link
                          to={`/superadmin/clients/${org.id}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {org.name}
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(org.created_at), "d MMM yyyy HH:mm", {
                            locale: nl,
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!org.setup_fee_paid && (
                        <Badge className="border-0 bg-orange-100 text-orange-700 text-xs">
                          Setup fee open
                        </Badge>
                      )}
                      {status && (
                        <Badge className={`border-0 text-xs ${status.class}`}>
                          {status.label}
                        </Badge>
                      )}
                      <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                        <Link to={`/superadmin/clients/${org.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
