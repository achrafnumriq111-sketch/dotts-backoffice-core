import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Skeleton } from "@/components/ui/skeleton";
import { t, formatEUR, formatDateNL } from "@/lib/i18n";
import { useOrg } from "@/context/OrgContext";
import { supabase } from "@/integrations/supabase/client";

type SubscriptionStatus = "pending_setup" | "active" | "past_due" | "paused" | "canceled";
type SetupFeeStatus = "pending" | "paid" | "waived" | "refunded";
type InvoiceStatus = "open" | "paid" | "past_due" | "void" | "refunded";

interface SubscriptionRow {
  status: string;
  billing_cycle: string;
  price_cents: number;
  currency: string;
  current_period_end: string | null;
  contract_min_end_at: string | null;
  setup_fee_cents: number;
  setup_fee_status: string;
  plans: { name: string; currency: string } | null;
}

interface InvoiceRow {
  id: string;
  created_at: string;
  description: string | null;
  kind: string;
  amount_cents: number;
  status: string;
  hosted_invoice_url?: string | null;
  invoice_pdf_url?: string | null;
}

const SUBSCRIPTION_STATUS_MAP: Record<SubscriptionStatus, { label: string; className: string }> = {
  pending_setup: {
    label: "Wacht op setup-fee",
    className: "border-0 bg-warning-muted text-warning hover:bg-warning-muted",
  },
  active: {
    label: "Actief",
    className: "border-0 bg-success-muted text-success hover:bg-success-muted",
  },
  past_due: {
    label: "Betaling achterstallig",
    className: "border-0 bg-destructive/10 text-destructive hover:bg-destructive/10",
  },
  paused: {
    label: "Gepauzeerd",
    className: "border-0 bg-muted text-muted-foreground hover:bg-muted",
  },
  canceled: {
    label: "Beëindigd",
    className: "border-0 bg-muted text-muted-foreground hover:bg-muted",
  },
};

const SETUP_FEE_STATUS_MAP: Record<SetupFeeStatus, { label: string; className: string }> = {
  pending: {
    label: "Openstaand",
    className: "border-0 bg-warning-muted text-warning hover:bg-warning-muted",
  },
  paid: {
    label: "Betaald",
    className: "border-0 bg-success-muted text-success hover:bg-success-muted",
  },
  waived: {
    label: "Kwijtgescholden",
    className: "border-0 bg-muted text-muted-foreground hover:bg-muted",
  },
  refunded: {
    label: "Terugbetaald",
    className: "border-0 bg-muted text-muted-foreground hover:bg-muted",
  },
};

const INVOICE_STATUS_MAP: Record<InvoiceStatus, { label: string; className: string }> = {
  open: {
    label: "Openstaand",
    className: "border-0 bg-warning-muted text-warning hover:bg-warning-muted",
  },
  paid: {
    label: "Betaald",
    className: "border-0 bg-success-muted text-success hover:bg-success-muted",
  },
  past_due: {
    label: "Achterstallig",
    className: "border-0 bg-destructive/10 text-destructive hover:bg-destructive/10",
  },
  void: {
    label: "Geannuleerd",
    className: "border-0 bg-muted text-muted-foreground hover:bg-muted",
  },
  refunded: {
    label: "Terugbetaald",
    className: "border-0 bg-muted text-muted-foreground hover:bg-muted",
  },
};

const INVOICE_KIND_LABELS: Record<string, string> = {
  subscription: "Abonnement",
  setup_fee: "Setup-fee",
  one_off: "Eenmalig",
};

function StatusBadge<T extends string>({
  status,
  map,
}: {
  status: string;
  map: Record<T, { label: string; className: string }>;
}) {
  const entry = (map as Record<string, { label: string; className: string }>)[status] ?? {
    label: status,
    className: "border-0 bg-muted text-muted-foreground hover:bg-muted",
  };
  return <Badge className={entry.className}>{entry.label}</Badge>;
}

export default function Subscription() {
  const tr = t();
  const { currentOrg, currentOrgFull, loading: orgLoading, refetchOrg } = useOrg();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [subLoading, setSubLoading] = useState(true);
  const [invLoading, setInvLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Handle ?checkout=success|cancel from Stripe redirect
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (!checkout) return;
    if (checkout === "success") {
      toast.success("Betaling geslaagd, je POS is geactiveerd");
      refetchOrg();
      if (currentOrg) {
        queryClient.invalidateQueries({ queryKey: ["organization", currentOrg.id] });
      }
    } else if (checkout === "cancel") {
      toast.error("Betaling afgebroken");
    }
    // Clean the URL
    const next = new URLSearchParams(searchParams);
    next.delete("checkout");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCheckout = async () => {
    if (!currentOrg) return;
    setCheckoutLoading(true);
    const { data, error } = await supabase.functions.invoke("create-checkout-session", {
      body: { org_id: currentOrg.id },
    });
    setCheckoutLoading(false);
    if (error) {
      toast.error("Checkout starten mislukt: " + error.message);
      return;
    }
    if (data?.url) {
      window.location.href = data.url as string;
    } else {
      toast.error("Checkout starten mislukt");
    }
  };

  useEffect(() => {
    if (!currentOrg) return;
    let cancelled = false;
    setSubLoading(true);
    setInvLoading(true);

    (async () => {
      const [subRes, invRes] = await Promise.all([
        supabase
          .from("subscriptions")
          .select(
            "status, billing_cycle, price_cents, currency, current_period_end, contract_min_end_at, setup_fee_cents, setup_fee_status, plans(name, currency)",
          )
          .eq("org_id", currentOrg.id)
          .maybeSingle(),
        supabase
          .from("invoices")
          .select("id, created_at, description, kind, amount_cents, status, hosted_invoice_url, invoice_pdf_url")
          .eq("org_id", currentOrg.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (cancelled) return;

      if (subRes.error) {
        console.error("Failed to load subscription", subRes.error);
        toast.error("Er ging iets mis bij het laden");
      } else {
        setSubscription(subRes.data as SubscriptionRow | null);
      }
      setSubLoading(false);

      if (invRes.error) {
        console.error("Failed to load invoices", invRes.error);
        toast.error("Er ging iets mis bij het laden");
      } else {
        setInvoices((invRes.data ?? []) as InvoiceRow[]);
      }
      setInvLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentOrg]);

  const cycleLabel =
    subscription?.billing_cycle === "monthly"
      ? "Maandelijks"
      : subscription?.billing_cycle === "yearly"
      ? "Jaarlijks"
      : "—";

  return (
    <>
      <PageHeader title={tr.subscription.title} subtitle={tr.subscription.subtitle} />

      <div className="space-y-4">
        {/* Active subscription success state */}
        {currentOrgFull?.setup_fee_paid &&
          currentOrgFull?.subscription_status === "active" && (
            <Card className="border-success/40 bg-success-muted">
              <CardContent className="flex items-center gap-3 py-4">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div className="text-sm">
                  <p className="font-medium text-success">Actief abonnement</p>
                  <p className="text-muted-foreground">
                    {subscription
                      ? `${formatEUR(subscription.price_cents)}/${subscription.billing_cycle === "yearly" ? "jr" : "mnd"} · `
                      : ""}
                    verlengt op{" "}
                    {formatDateNL(currentOrgFull.subscription_current_period_end)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Current plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tr.subscription.currentPlan}</CardTitle>
          </CardHeader>
          <CardContent>
            {subLoading || orgLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
              </div>
            ) : subscription ? (
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">{tr.subscription.plan}</p>
                  <p className="mt-1 font-medium">{subscription.plans?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{tr.subscription.price}</p>
                  <p className="mt-1 font-medium">{formatEUR(subscription.price_cents)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{tr.subscription.cycle}</p>
                  <p className="mt-1 font-medium">{cycleLabel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{tr.subscription.nextBilling}</p>
                  <p className="mt-1 font-medium">
                    {formatDateNL(
                      currentOrgFull?.subscription_current_period_end ??
                        subscription.current_period_end,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{tr.subscription.contractEnd}</p>
                  <p className="mt-1 font-medium">
                    {formatDateNL(subscription.contract_min_end_at)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{tr.common.status}</p>
                  <div className="mt-1">
                    <StatusBadge
                      status={
                        currentOrgFull?.setup_fee_paid
                          ? currentOrgFull?.subscription_status === "active"
                            ? "active"
                            : "paused"
                          : "pending_setup"
                      }
                      map={
                        currentOrgFull?.setup_fee_paid &&
                        currentOrgFull?.subscription_status !== "active"
                          ? {
                              ...SUBSCRIPTION_STATUS_MAP,
                              paused: {
                                label: "Abonnement inactief",
                                className:
                                  "border-0 bg-warning-muted text-warning hover:bg-warning-muted",
                              },
                            }
                          : SUBSCRIPTION_STATUS_MAP
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Geen abonnement gevonden.</p>
            )}
          </CardContent>
        </Card>

        {/* Setup fee */}
        <Card className={!currentOrgFull?.setup_fee_paid ? "border-warning/40" : ""}>
          <CardHeader>
            <CardTitle className="text-base">{tr.subscription.setupFee}</CardTitle>
          </CardHeader>
          <CardContent>
            {subLoading ? (
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-24" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            ) : subscription ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{tr.subscription.amount}</p>
                  <p className="mt-1 text-xl font-semibold">
                    {formatEUR(subscription.setup_fee_cents)}
                  </p>
                  {currentOrgFull?.setup_fee_paid && currentOrgFull?.setup_fee_paid_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Betaald op {formatDateNL(currentOrgFull.setup_fee_paid_at)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge
                    status={currentOrgFull?.setup_fee_paid ? "paid" : "pending"}
                    map={SETUP_FEE_STATUS_MAP}
                  />
                  {!currentOrgFull?.setup_fee_paid && (
                    <Button size="sm" onClick={startCheckout} disabled={checkoutLoading}>
                      {checkoutLoading && (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      )}
                      Start betaling
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tr.subscription.invoices}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {invLoading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : invoices.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Nog geen facturen.</p>
            ) : (
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
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDateNL(inv.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {inv.description ?? INVOICE_KIND_LABELS[inv.kind] ?? inv.kind}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatEUR(inv.amount_cents)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={inv.status} map={INVOICE_STATUS_MAP} />
                      </TableCell>
                       <TableCell className="text-right">
                         {(inv.invoice_pdf_url || inv.hosted_invoice_url) ? (
                           <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                             <a
                               href={inv.invoice_pdf_url || inv.hosted_invoice_url || "#"}
                               target="_blank"
                               rel="noopener noreferrer"
                               aria-label="Factuur downloaden"
                             >
                               <Download className="h-4 w-4" />
                             </a>
                           </Button>
                         ) : (
                           <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                             <Download className="h-4 w-4" />
                           </Button>
                         )}
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
