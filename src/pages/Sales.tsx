import { useEffect, useMemo, useState } from "react";
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { nl } from "date-fns/locale";
import { Ban, ChevronRight, Search } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/context/OrgContext";
import { formatPriceCents } from "@/lib/eur";
import { ReceiptView, type ReceiptSale } from "@/components/receipt/ReceiptView";
import { cn } from "@/lib/utils";
// receipt HTML is now generated server-side in the email-receipt edge function
import { usePositionPermissions } from "@/hooks/usePositionPermissions";

type DateRangeKey = "today" | "yesterday" | "week" | "month" | "custom";
type PaymentFilter = "all" | "cash" | "pin";
type StatusFilter = "all" | "completed" | "voided";
type SortKey = "date" | "total";
type SortDir = "asc" | "desc";

interface SaleRow {
  id: string;
  receipt_number: string;
  created_at: string;
  total_cents: number;
  status: string;
  voided: boolean;
  location_id: string | null;
  sale_items: { count: number }[] | null;
  payments: { method: string; amount_cents: number }[] | null;
}

interface SaleDetailItem {
  id: string;
  quantity: number;
  name_snapshot: string;
  variant_name: string | null;
  price_cents_snapshot: number;
  tax_rate_bps_snapshot: number;
  modifiers: Array<{ name: string; price_cents: number }> | null;
  line_subtotal_cents: number;
  line_tax_cents: number;
  line_total_cents: number;
}

interface SaleDetailPayment {
  id: string;
  method: string;
  amount_cents: number;
  tendered_cents: number | null;
  change_cents: number | null;
}

interface SaleDetail {
  id: string;
  receipt_number: string;
  created_at: string;
  status: string;
  voided: boolean;
  voided_at: string | null;
  voided_reason: string | null;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  location_id: string | null;
  customer_email: string | null;
  receipt_emailed_at: string | null;
  receipt_emailed_to: string | null;
  locations: { name: string } | null;
  sale_items: SaleDetailItem[];
  payments: SaleDetailPayment[];
}

function formatDutchDateTime(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function getDateRange(key: DateRangeKey, customFrom?: Date, customTo?: Date): { from: Date; to: Date } {
  const now = new Date();
  switch (key) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case "week":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "custom":
      return {
        from: customFrom ? startOfDay(customFrom) : startOfDay(now),
        to: customTo ? endOfDay(customTo) : endOfDay(now),
      };
  }
}

function paymentLabel(method: string): string {
  if (method === "cash") return "Contant";
  if (method === "pin") return "PIN";
  return method;
}

function statusBadge(status: string, voided?: boolean) {
  if (voided || status === "voided") {
    return (
      <Badge variant="destructive" className="border-0">
        Gestorneerd
      </Badge>
    );
  }
  return (
    <Badge className="bg-success-muted text-success hover:bg-success-muted border-0">
      Voltooid
    </Badge>
  );
}

export default function Sales() {
  const { currentOrg, currentOrgFull } = useOrg();
  const { canVoidSale, canEmailReceipt } = usePositionPermissions(currentOrg?.id);

  const [rangeKey, setRangeKey] = useState<DateRangeKey>("today");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchReceipt, setSearchReceipt] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [rows, setRows] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SaleDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Storno state
  const [stornoOpen, setStornoOpen] = useState(false);
  const [stornoReason, setStornoReason] = useState("");
  const [stornoSubmitting, setStornoSubmitting] = useState(false);

  // Email receipt state
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);

  const dateRange = useMemo(() => {
    const cf = customFrom ? new Date(customFrom) : undefined;
    const ct = customTo ? new Date(customTo) : undefined;
    return getDateRange(rangeKey, cf, ct);
  }, [rangeKey, customFrom, customTo]);

  useEffect(() => {
    if (!currentOrg) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      let q = supabase
        .from("sales")
        .select(
          "id, receipt_number, created_at, total_cents, status, voided, location_id, sale_items(count), payments(method, amount_cents)",
        )
        .eq("org_id", currentOrg.id)
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: false })
        .limit(200);

      if (searchReceipt.trim()) {
        q = q.ilike("receipt_number", `%${searchReceipt.trim()}%`);
      }
      if (statusFilter !== "all") {
        if (statusFilter === "voided") {
          q = q.eq("voided", true);
        } else {
          q = q.eq("voided", false).eq("status", "completed");
        }
      }

      const { data, error } = await q;
      if (cancelled) return;

      if (error) {
        console.error("sales load failed", error);
        toast.error("Er ging iets mis bij het laden");
        setRows([]);
      } else {
        setRows((data ?? []) as SaleRow[]);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentOrg, dateRange.from, dateRange.to, searchReceipt, statusFilter]);

  // Client-side payment method filter (since payments is a join)
  const filteredRows = useMemo(() => {
    let out = rows;
    if (paymentFilter !== "all") {
      out = out.filter((r) => r.payments?.some((p) => p.method === paymentFilter));
    }
    out = [...out].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        cmp = a.total_cents - b.total_cents;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [rows, paymentFilter, sortKey, sortDir]);

  const kpis = useMemo(() => {
    const nonVoided = filteredRows.filter((r) => !r.voided);
    const omzet = nonVoided.reduce((s, r) => s + r.total_cents, 0);
    const aantal = nonVoided.length;
    const gemiddeld = aantal > 0 ? Math.round(omzet / aantal) : 0;
    return { omzet, aantal, gemiddeld };
  }, [filteredRows]);

  // Load detail when a row is selected
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, sale_items(*), payments(*), locations(name)")
        .eq("id", selectedId)
        .single();
      if (cancelled) return;
      if (error) {
        console.error("sale detail failed", error);
        toast.error("Er ging iets mis bij het laden");
        setDetail(null);
      } else {
        setDetail(data as unknown as SaleDetail);
      }
      setDetailLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const reloadAfterStorno = async () => {
    if (!currentOrg) return;
    // Refresh list — preserve current search/filter selections.
    let q = supabase
      .from("sales")
      .select(
        "id, receipt_number, created_at, total_cents, status, voided, location_id, sale_items(count), payments(method, amount_cents)",
      )
      .eq("org_id", currentOrg.id)
      .gte("created_at", dateRange.from.toISOString())
      .lte("created_at", dateRange.to.toISOString())
      .order("created_at", { ascending: false })
      .limit(200);
    if (searchReceipt.trim()) {
      q = q.ilike("receipt_number", `%${searchReceipt.trim()}%`);
    }
    if (statusFilter !== "all") {
      if (statusFilter === "voided") {
        q = q.eq("voided", true);
      } else {
        q = q.eq("voided", false).eq("status", "completed");
      }
    }
    const { data: listData } = await q;
    setRows((listData ?? []) as SaleRow[]);
    // Refresh detail
    if (selectedId) {
      const { data: d } = await supabase
        .from("sales")
        .select("*, sale_items(*), payments(*), locations(name)")
        .eq("id", selectedId)
        .single();
      if (d) setDetail(d as unknown as SaleDetail);
    }
  };

  const mapStornoError = (msg: string): string => {
    if (msg.includes("unauthorized")) return "Je bent niet ingelogd.";
    if (msg.includes("forbidden_session_closed"))
      return "Je kunt alleen verkopen uit de huidige open kassasessie storneren. Vraag een manager.";
    if (msg.includes("forbidden")) return "Je hebt geen toegang tot deze verkoop.";
    if (msg.includes("reason_required")) return "Reden moet minimaal 3 tekens zijn.";
    if (msg.includes("already_voided")) return "Deze verkoop is al gestorneerd.";
    if (msg.includes("sale_not_found")) return "Verkoop niet gevonden.";
    return msg;
  };

  const handleStorno = async () => {
    if (!detail) return;
    const reason = stornoReason.trim();
    if (reason.length < 3) {
      toast.error("Reden moet minimaal 3 tekens zijn.");
      return;
    }
    setStornoSubmitting(true);
    const { error } = await supabase.rpc("void_sale", {
      p_sale_id: detail.id,
      p_reason: reason,
    });
    setStornoSubmitting(false);
    if (error) {
      console.error("void_sale failed", error);
      toast.error(mapStornoError(error.message ?? ""));
      return;
    }
    toast.success("Verkoop gestorneerd");
    setStornoOpen(false);
    setStornoReason("");
    await reloadAfterStorno();
  };

  const reloadDetail = async () => {
    if (!selectedId) return;
    const { data } = await supabase
      .from("sales")
      .select("*, sale_items(*), payments(*), locations(name)")
      .eq("id", selectedId)
      .single();
    if (data) setDetail(data as unknown as SaleDetail);
  };

  const mapEmailError = (msg: string): string => {
    if (msg.includes("unauthorized")) return "Je bent niet ingelogd.";
    if (msg.includes("forbidden")) return "Geen toegang tot deze verkoop.";
    if (msg.includes("sale_not_found")) return "Verkoop niet gevonden.";
    if (msg.includes("invalid_email")) return "Ongeldig e-mailadres.";
    if (msg.includes("brevo_failed")) return "E-mail versturen mislukt. Probeer opnieuw.";
    if (
      msg.includes("html_required") ||
      msg.includes("subject_required") ||
      msg.includes("sale_id_required")
    ) {
      return "Er ging iets mis bij het opmaken van de bon.";
    }
    return msg;
  };

  const handleEmailReceipt = async () => {
    if (!detail) return;
    const email = emailValue.trim();
    if (!email.includes("@")) {
      toast.error("Ongeldig e-mailadres.");
      return;
    }
    setEmailSubmitting(true);
    const { data, error } = await supabase.functions.invoke("email-receipt", {
      body: {
        sale_id: detail.id,
        recipient_email: email,
      },
    });
    setEmailSubmitting(false);
    if (error) {
      console.error("email-receipt failed", error, data);
      const errMsg =
        (data as { error?: string } | null)?.error ?? error.message ?? "unknown_error";
      toast.error(mapEmailError(errMsg));
      return;
    }
    if (data && typeof data === "object" && "error" in data && data.error) {
      toast.error(mapEmailError(String(data.error)));
      return;
    }
    toast.success(`Bon verzonden naar ${email}`);
    setEmailOpen(false);
    await reloadDetail();
  };

  return (
    <>
      <PageHeader title="Verkopen" subtitle="Geschiedenis van alle bonnen." />

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Periode</label>
            <Select value={rangeKey} onValueChange={(v) => setRangeKey(v as DateRangeKey)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Vandaag</SelectItem>
                <SelectItem value="yesterday">Gisteren</SelectItem>
                <SelectItem value="week">Deze week</SelectItem>
                <SelectItem value="month">Deze maand</SelectItem>
                <SelectItem value="custom">Aangepast</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {rangeKey === "custom" && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Van</label>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-[160px]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Tot</label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-[160px]"
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Betaalmethode</label>
            <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as PaymentFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="cash">Contant</SelectItem>
                <SelectItem value="pin">PIN</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="completed">Voltooid</SelectItem>
                <SelectItem value="voided">Gestorneerd</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto space-y-1">
            <label className="text-xs text-muted-foreground">Zoeken</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchReceipt}
                onChange={(e) => setSearchReceipt(e.target.value)}
                placeholder="Zoek op bonnummer…"
                className="w-[240px] pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <KpiCard label="Omzet" value={formatPriceCents(kpis.omzet)} loading={loading} />
        <KpiCard label="Aantal bonnen" value={String(kpis.aantal)} loading={loading} />
        <KpiCard
          label="Gemiddelde bon"
          value={formatPriceCents(kpis.gemiddeld)}
          loading={loading}
        />
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bonnummer</TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("date")}
                  className="font-medium hover:text-foreground"
                >
                  Datum/tijd {sortKey === "date" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </button>
              </TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead>Betaling</TableHead>
              <TableHead className="text-right">
                <button
                  onClick={() => toggleSort("total")}
                  className="font-medium hover:text-foreground"
                >
                  Totaal {sortKey === "total" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  <p className="text-base font-medium text-foreground">Geen verkopen gevonden</p>
                  <p className="mt-1 text-sm">Pas de filters aan om andere bonnen te zien.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((r) => {
                const itemCount = r.sale_items?.[0]?.count ?? 0;
                const method = r.payments?.[0]?.method;
                return (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(r.id)}
                  >
                    <TableCell className="font-medium">{r.receipt_number}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDutchDateTime(r.created_at)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{itemCount}</TableCell>
                    <TableCell>{method ? paymentLabel(method) : "—"}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums font-medium",
                        r.voided && "line-through text-muted-foreground",
                      )}
                    >
                      {formatPriceCents(r.total_cents)}
                    </TableCell>
                    <TableCell>{statusBadge(r.status, r.voided)}</TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Detail drawer */}
      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[480px]">
          {detailLoading || !detail ? (
            <div className="space-y-3 py-6">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">Bon {detail.receipt_number}</SheetTitle>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-sm text-muted-foreground">
                    {formatDutchDateTime(detail.created_at)}
                  </span>
                  {statusBadge(detail.status, detail.voided)}
                </div>
              </SheetHeader>

              {detail.voided && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>
                    Gestorneerd op{" "}
                    {detail.voided_at
                      ? format(new Date(detail.voided_at), "d MMM yyyy HH:mm", { locale: nl })
                      : "—"}{" "}
                    — Reden: {detail.voided_reason ?? "—"}
                  </AlertDescription>
                </Alert>
              )}

              <div className="mt-4 flex justify-end">
                {canVoidSale && (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={detail.voided}
                    onClick={() => {
                      setStornoReason("");
                      setStornoOpen(true);
                    }}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Storneer verkoop
                  </Button>
                )}
              </div>

              <div className="mt-4 flex justify-center">
                {(() => {
                  const taxByRate = Object.entries(
                    detail.sale_items.reduce<Record<number, number>>((acc, it) => {
                      acc[it.tax_rate_bps_snapshot] =
                        (acc[it.tax_rate_bps_snapshot] ?? 0) + it.line_tax_cents;
                      return acc;
                    }, {}),
                  ).map(([bps, vat]) => ({
                    rate_bps: Number(bps),
                    vat_cents: vat,
                  }));
                  const firstPayment = detail.payments[0];
                  const sale: ReceiptSale = {
                    receipt_number: detail.receipt_number,
                    created_at: detail.created_at,
                    subtotal_cents: detail.subtotal_cents,
                    total_cents: detail.total_cents,
                    tax_by_rate: taxByRate,
                    location_name: detail.locations?.name ?? null,
                    lines: detail.sale_items.map((it) => ({
                      key: it.id,
                      quantity: Number(it.quantity),
                      productName: it.name_snapshot,
                      variantName: it.variant_name,
                      unitPriceCents: it.price_cents_snapshot,
                      lineTotalCents: it.line_total_cents,
                      modifiers: (it.modifiers ?? []) as { name: string; price_cents: number }[],
                    })),
                    payment: {
                      method: (firstPayment?.method as "cash" | "pin") ?? "pin",
                      amount_cents: firstPayment?.amount_cents ?? detail.total_cents,
                      tendered_cents: firstPayment?.tendered_cents,
                      change_cents: firstPayment?.change_cents,
                    },
                  };
                  return <ReceiptView org={currentOrgFull} sale={sale} className="w-full" />;
                })()}
              </div>

              <SheetFooter className="mt-4 flex-col items-end gap-2 sm:space-x-0">
                {detail.receipt_emailed_at && (
                  <p className="text-xs text-muted-foreground">
                    Verzonden naar {detail.receipt_emailed_to ?? "—"} op{" "}
                    {format(new Date(detail.receipt_emailed_at), "d MMM HH:mm", { locale: nl })}
                  </p>
                )}
                {canEmailReceipt && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEmailValue(detail.customer_email ?? "");
                      setEmailOpen(true);
                    }}
                  >
                    Mail bon
                  </Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Storno confirm dialog */}
      <AlertDialog open={stornoOpen} onOpenChange={setStornoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verkoop storneren?</AlertDialogTitle>
            <AlertDialogDescription>
              Dit kan niet ongedaan gemaakt worden. De voorraad wordt automatisch teruggeboekt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="storno-reason">Reden voor storno</Label>
            <Textarea
              id="storno-reason"
              value={stornoReason}
              onChange={(e) => setStornoReason(e.target.value)}
              placeholder="Bijv: verkeerd product gescand"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={stornoSubmitting}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleStorno();
              }}
              disabled={stornoReason.trim().length < 3 || stornoSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {stornoSubmitting ? "Bezig…" : "Storneren"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email receipt dialog */}
      <Dialog open={emailOpen} onOpenChange={(o) => !emailSubmitting && setEmailOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bon mailen</DialogTitle>
            <DialogDescription>
              Vul het e-mailadres in waar de bon naartoe verstuurd moet worden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="email-recipient">E-mailadres ontvanger</Label>
            <Input
              id="email-recipient"
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
              onClick={handleEmailReceipt}
              disabled={!emailValue.trim().includes("@") || emailSubmitting}
            >
              {emailSubmitting ? "Bezig…" : "Verstuur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function KpiCard({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-7 w-24" />
        ) : (
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
