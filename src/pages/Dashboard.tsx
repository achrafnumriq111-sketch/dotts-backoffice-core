import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fromZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { ArrowUpRight, ArrowDownRight, Receipt, ShoppingBag, Users, Wallet, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { t, formatCurrency } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/context/OrgContext";

const TZ = "Europe/Amsterdam";

/** Returns the start of "today" in Europe/Amsterdam, expressed as a UTC Date. */
function startOfTodayAmsterdam(): Date {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return fromZonedTime(`${get("year")}-${get("month")}-${get("day")}T00:00:00`, TZ);
}

interface DayStats {
  omzetCents: number;
  count: number;
}

interface RecentSale {
  id: string;
  receipt_number: string;
  created_at: string;
  total_cents: number;
  voided: boolean;
}

async function fetchDayStats(orgId: string, from: Date, to: Date): Promise<DayStats> {
  const { data, error } = await supabase
    .from("sales")
    .select("total_cents")
    .eq("org_id", orgId)
    .eq("voided", false)
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString());
  if (error) {
    console.error("dashboard sales load failed", error);
    return { omzetCents: 0, count: 0 };
  }
  const rows = data ?? [];
  return {
    omzetCents: rows.reduce((s, r) => s + (r.total_cents ?? 0), 0),
    count: rows.length,
  };
}

function formatPctDelta(today: number, yesterday: number): string | null {
  if (yesterday <= 0) return null;
  const pct = ((today - yesterday) / yesterday) * 100;
  const rounded = Math.round(pct * 10) / 10;
  const sign = rounded >= 0 ? "+" : "−";
  return `${sign}${Math.abs(rounded).toFixed(1).replace(".", ",")}%`;
}

function formatCountDelta(today: number, yesterday: number): string | null {
  if (yesterday <= 0) return null;
  const diff = today - yesterday;
  const sign = diff >= 0 ? "+" : "−";
  return `${sign}${Math.abs(diff)}`;
}

export default function Dashboard() {
  const tr = t();
  const { currentOrg } = useOrg();
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState<DayStats>({ omzetCents: 0, count: 0 });
  const [yesterday, setYesterday] = useState<DayStats>({ omzetCents: 0, count: 0 });
  const [activeStaff, setActiveStaff] = useState<number>(0);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);

  useEffect(() => {
    if (!currentOrg) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      const startToday = startOfTodayAmsterdam();
      const startTomorrow = new Date(startToday.getTime() + 24 * 60 * 60 * 1000);
      const startYesterday = new Date(startToday.getTime() - 24 * 60 * 60 * 1000);

      const [todayStats, yStats, staff, recent] = await Promise.all([
        fetchDayStats(currentOrg.id, startToday, startTomorrow),
        fetchDayStats(currentOrg.id, startYesterday, startToday),
        supabase
          .from("org_members")
          .select("user_id", { count: "exact", head: true })
          .eq("org_id", currentOrg.id),
        supabase
          .from("sales")
          .select("id, receipt_number, created_at, total_cents, voided")
          .eq("org_id", currentOrg.id)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      if (cancelled) return;
      setToday(todayStats);
      setYesterday(yStats);
      setActiveStaff(staff.count ?? 0);
      setRecentSales((recent.data ?? []) as RecentSale[]);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentOrg]);

  const avgToday = today.count > 0 ? today.omzetCents / today.count : null;
  const avgYesterday = yesterday.count > 0 ? yesterday.omzetCents / yesterday.count : 0;

  const kpis = [
    {
      label: tr.dashboard.revenueToday,
      value: formatCurrency(today.omzetCents / 100),
      delta: formatPctDelta(today.omzetCents, yesterday.omzetCents),
      icon: Wallet,
    },
    {
      label: tr.dashboard.transactions,
      value: String(today.count),
      delta: formatCountDelta(today.count, yesterday.count),
      icon: Receipt,
    },
    {
      label: tr.dashboard.avgTicket,
      value: avgToday === null ? "—" : formatCurrency(avgToday / 100),
      delta:
        avgToday !== null && avgYesterday > 0
          ? formatPctDelta(Math.round(avgToday), Math.round(avgYesterday))
          : null,
      icon: ShoppingBag,
    },
    {
      label: tr.dashboard.activeStaff,
      value: String(activeStaff),
      delta: null as string | null,
      icon: Users,
    },
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
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-semibold tracking-tight">{k.value}</div>
              )}
              {!loading && k.delta && (
                <p
                  className={
                    "mt-1 inline-flex items-center gap-1 text-xs " +
                    (k.delta.startsWith("−") ? "text-destructive" : "text-success")
                  }
                >
                  {k.delta.startsWith("−") ? (
                    <ArrowDownRight className="h-3 w-3" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3" />
                  )}
                  {k.delta}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{tr.dashboard.recentSales}</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/verkopen">
              Alles bekijken
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recentSales.length === 0 ? (
            <div className="rounded-md border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              {tr.dashboard.recentSalesEmpty}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentSales.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Receipt className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium tabular-nums">
                          {s.receipt_number}
                        </span>
                        {s.voided && (
                          <Badge
                            variant="outline"
                            className="border-0 bg-destructive/10 text-destructive"
                          >
                            Gestorneerd
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(s.created_at), "d MMM HH:mm", { locale: nl })}
                      </div>
                    </div>
                  </div>
                  <div
                    className={
                      "font-semibold tabular-nums " +
                      (s.voided ? "text-muted-foreground line-through" : "")
                    }
                  >
                    {formatCurrency(s.total_cents / 100)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
