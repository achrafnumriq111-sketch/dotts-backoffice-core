import { useCallback, useEffect, useMemo, useState } from "react";
import { subDays } from "date-fns";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Settings2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/context/OrgContext";
import { formatEUR, formatDateTimeNL } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type RangeKey = "7" | "30" | "90";

interface OpenSession {
  id: string;
  opened_at: string;
  opening_float_cents: number;
  opened_by: string;
  location_id: string;
}

interface ClosedSession {
  id: string;
  org_id: string;
  location_id: string;
  opened_at: string;
  closed_at: string | null;
  opened_by: string;
  closed_by: string | null;
  opening_float_cents: number;
  counted_cash_cents: number | null;
  expected_cash_cents: number | null;
  variance_cents: number | null;
  cash_sales_cents: number | null;
  pin_sales_cents: number | null;
  total_sales_cents: number | null;
  sale_count: number | null;
  notes: string | null;
  status: string;
  envelope_number: string | null;
}

interface SaleAgg {
  id: string;
  total_cents: number;
  payments: { method: string }[] | null;
}

const GENERIC_ERR = "Er ging iets mis. Probeer het opnieuw.";

function parseEuroInput(raw: string): number {
  const s = (raw ?? "").trim().replace(/\s/g, "").replace(",", ".");
  if (s === "" || s === "-" || s === ".") return 0;
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function VarianceBadge({ cents }: { cents: number }) {
  if (cents === 0) {
    return (
      <Badge className="bg-success text-success-foreground hover:bg-success">
        Sluitend
      </Badge>
    );
  }
  if (cents > 0) {
    return (
      <Badge variant="outline" className="border-warning text-warning">
        Overschot +{formatEUR(cents)}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-destructive text-destructive">
      Tekort −{formatEUR(Math.abs(cents))}
    </Badge>
  );
}

export default function Closing() {
  const { currentOrg, currentRole } = useOrg();
  const orgId = currentOrg?.id ?? null;
  const canManageSequence =
    currentRole === "owner" ||
    currentRole === "admin" ||
    currentRole === "manager";

  const [bootLoading, setBootLoading] = useState(true);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [session, setSession] = useState<OpenSession | null>(null);

  // State A — opening
  const [openingInput, setOpeningInput] = useState("0,00");
  const [opening, setOpening] = useState(false);

  // State B — closing
  const [salesLoading, setSalesLoading] = useState(false);
  const [cashTotal, setCashTotal] = useState(0);
  const [pinTotal, setPinTotal] = useState(0);
  const [saleCount, setSaleCount] = useState(0);
  const [countedInput, setCountedInput] = useState("");
  const [notes, setNotes] = useState("");
  const [closing, setClosing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // History
  const [range, setRange] = useState<RangeKey>("30");
  const [history, setHistory] = useState<ClosedSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [detail, setDetail] = useState<ClosedSession | null>(null);

  // Envelope success dialog
  const [envelopeDialog, setEnvelopeDialog] = useState<{
    open: boolean;
    number: string | null;
  }>({ open: false, number: null });

  // Sequence config dialog
  const [seqOpen, setSeqOpen] = useState(false);
  const [seqPrefix, setSeqPrefix] = useState("ENV");
  const [seqYear, setSeqYear] = useState<number>(new Date().getFullYear());
  const [seqNext, setSeqNext] = useState<number>(1);
  const [seqPadding, setSeqPadding] = useState<number>(4);
  const [seqSaving, setSeqSaving] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  // ------- Loaders -------
  const loadLocationAndSession = useCallback(async () => {
    if (!orgId) return;
    setBootLoading(true);

    const { data: locRow, error: locErr } = await supabase
      .from("locations")
      .select("id")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (locErr) {
      console.error("location load failed", locErr);
      toast.error(GENERIC_ERR);
      setBootLoading(false);
      return;
    }

    const lid = locRow?.id ?? null;
    setLocationId(lid);

    if (!lid) {
      setSession(null);
      setBootLoading(false);
      return;
    }

    const { data: sess, error: sessErr } = await supabase
      .from("register_sessions")
      .select("id, opened_at, opening_float_cents, opened_by, location_id")
      .eq("org_id", orgId)
      .eq("location_id", lid)
      .eq("status", "open")
      .maybeSingle();

    if (sessErr) {
      console.error("session load failed", sessErr);
      toast.error(GENERIC_ERR);
      setBootLoading(false);
      return;
    }

    setSession(sess ?? null);
    setBootLoading(false);
  }, [orgId]);

  const loadShiftSales = useCallback(async () => {
    if (!session || !locationId) return;
    setSalesLoading(true);
    const { data, error } = await supabase
      .from("sales")
      .select("id, total_cents, payments(method)")
      .eq("location_id", locationId)
      .eq("status", "completed")
      .eq("voided", false)
      .gte("created_at", session.opened_at);

    if (error) {
      console.error("shift sales load failed", error);
      toast.error(GENERIC_ERR);
      setSalesLoading(false);
      return;
    }

    let cash = 0;
    let pin = 0;
    for (const s of (data ?? []) as SaleAgg[]) {
      const methods = new Set((s.payments ?? []).map((p) => p.method));
      if (methods.has("cash")) cash += s.total_cents;
      if (methods.has("pin")) pin += s.total_cents;
    }
    setCashTotal(cash);
    setPinTotal(pin);
    setSaleCount(data?.length ?? 0);
    setSalesLoading(false);
  }, [session, locationId]);

  const loadHistory = useCallback(async () => {
    if (!orgId) return;
    setHistoryLoading(true);
    const days = Number.parseInt(range, 10);
    const from = subDays(new Date(), days);

    const { data, error } = await supabase
      .from("register_sessions")
      .select("*")
      .eq("org_id", orgId)
      .eq("status", "closed")
      .gte("closed_at", from.toISOString())
      .order("closed_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("history load failed", error);
      toast.error(GENERIC_ERR);
      setHistoryLoading(false);
      return;
    }
    setHistory((data ?? []) as ClosedSession[]);
    setHistoryLoading(false);
  }, [orgId, range]);

  useEffect(() => {
    loadLocationAndSession();
  }, [loadLocationAndSession]);

  useEffect(() => {
    loadShiftSales();
  }, [loadShiftSales]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ------- Derived -------
  const expectedCash = useMemo(() => {
    if (!session) return 0;
    return session.opening_float_cents + cashTotal;
  }, [session, cashTotal]);

  const countedCents = useMemo(() => parseEuroInput(countedInput), [countedInput]);
  const variance = useMemo(
    () => countedCents - expectedCash,
    [countedCents, expectedCash],
  );
  const hasCounted = countedInput.trim() !== "";

  // ------- Mutations -------
  const handleOpen = async () => {
    if (!locationId) {
      toast.error("Geen locatie gevonden.");
      return;
    }
    const cents = parseEuroInput(openingInput);
    if (cents < 0) {
      toast.error("Openingsbedrag kan niet negatief zijn.");
      return;
    }
    setOpening(true);
    const { error } = await supabase.rpc("open_register_session", {
      p_location_id: locationId,
      p_opening_float_cents: cents,
    });
    setOpening(false);

    if (error) {
      console.error("open session failed", error);
      toast.error(error.message ?? GENERIC_ERR);
      return;
    }
    toast.success("Kassa geopend");
    setOpeningInput("0,00");
    await loadLocationAndSession();
  };

  const handleClose = async () => {
    if (!session) return;
    const sessionIdToClose = session.id;
    setClosing(true);
    const { error } = await supabase.rpc("close_register_session", {
      p_session_id: session.id,
      p_counted_cash_cents: countedCents,
      p_notes: notes.trim() ? notes.trim() : null,
    });
    setClosing(false);
    setConfirmOpen(false);

    if (error) {
      console.error("close session failed", error);
      toast.error(error.message ?? GENERIC_ERR);
      return;
    }
    toast.success("Kassa gesloten");

    // Assign envelope number
    let envelopeNumber: string | null = null;
    const { data: envData, error: envErr } = await supabase.rpc(
      "get_or_create_cash_envelope_number" as never,
      { p_register_session_id: sessionIdToClose } as never,
    );
    if (envErr) {
      console.error("envelope assign failed", envErr);
      toast.warning(
        "Kassa afgesloten, maar envelopnummer kon niet worden toegewezen.",
      );
    } else if (typeof envData === "string") {
      envelopeNumber = envData;
    }
    setEnvelopeDialog({ open: true, number: envelopeNumber });

    setCountedInput("");
    setNotes("");
    setCashTotal(0);
    setPinTotal(0);
    setSaleCount(0);
    await loadLocationAndSession();
    await loadHistory();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Gekopieerd");
    } catch {
      toast.error("Kopiëren mislukt");
    }
  };

  const handleGenerateEnvelope = async (sessionId: string) => {
    setGeneratingFor(sessionId);
    const { error } = await supabase.rpc(
      "get_or_create_cash_envelope_number" as never,
      { p_register_session_id: sessionId } as never,
    );
    setGeneratingFor(null);
    if (error) {
      console.error("envelope generate failed", error);
      toast.error(error.message ?? GENERIC_ERR);
      return;
    }
    toast.success("Envelopnummer toegewezen");
    await loadHistory();
  };

  const seqPreview = useMemo(() => {
    const padded = String(Math.max(1, seqNext)).padStart(
      Math.max(1, seqPadding),
      "0",
    );
    return `${seqPrefix || "ENV"}-${seqYear}-${padded}`;
  }, [seqPrefix, seqYear, seqNext, seqPadding]);

  const handleSaveSequence = async () => {
    if (!orgId) return;
    setSeqSaving(true);
    const { error } = await supabase.rpc(
      "configure_cash_envelope_sequence" as never,
      {
        p_org_id: orgId,
        p_year: seqYear,
        p_prefix: seqPrefix || "ENV",
        p_next_number: seqNext,
        p_padding: seqPadding,
      } as never,
    );
    setSeqSaving(false);
    if (error) {
      console.error("configure sequence failed", error);
      toast.error(error.message ?? GENERIC_ERR);
      return;
    }
    toast.success("Nummerreeks opgeslagen");
    setSeqOpen(false);
  };

  // ------- Render -------
  return (
    <>
      <PageHeader
        title="Kasafsluiting"
        subtitle="Open of sluit je kassa en bekijk de geschiedenis."
        action={
          canManageSequence ? (
            <Button variant="outline" size="sm" onClick={() => setSeqOpen(true)}>
              <Settings2 className="mr-2 h-4 w-4" />
              Nummerreeks
            </Button>
          ) : null
        }
      />

      {bootLoading ? (
        <div className="mx-auto w-full max-w-[480px]">
          <Skeleton className="h-48 w-full" />
        </div>
      ) : !locationId ? (
        <Card className="mx-auto max-w-[480px]">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Geen actieve locatie gevonden voor deze organisatie.
          </CardContent>
        </Card>
      ) : !session ? (
        <Card className="mx-auto w-full max-w-[480px]">
          <CardHeader>
            <CardTitle>Kassa openen</CardTitle>
            <p className="text-sm text-muted-foreground">
              Begin de dag door het openingsbedrag in je kassalade in te voeren.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="opening">Openingsbedrag</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  €
                </span>
                <Input
                  id="opening"
                  inputMode="decimal"
                  className="pl-7 tabular-nums"
                  value={openingInput}
                  onChange={(e) => setOpeningInput(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                />
              </div>
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={handleOpen}
              disabled={opening}
            >
              {opening ? "Bezig…" : "Kassa openen"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <div>
            <h2 className="text-xl font-semibold">Kasafsluiting</h2>
            <p className="text-sm text-muted-foreground">
              Geopend om {formatDateTimeNL(session.opened_at)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Het envelopnummer wordt automatisch toegewezen bij het afsluiten.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vandaag in de kassa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {salesLoading ? (
                  <>
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-7 w-full" />
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Openingsbedrag</span>
                      <span className="tabular-nums">
                        {formatEUR(session.opening_float_cents)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contante verkopen</span>
                      <span className="tabular-nums">{formatEUR(cashTotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>PIN verkopen</span>
                      <span className="tabular-nums">{formatEUR(pinTotal)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-base font-semibold">
                      <span>Verwacht in kassa</span>
                      <span className="tabular-nums">{formatEUR(expectedCash)}</span>
                    </div>
                    <p className="pt-2 text-xs text-muted-foreground">
                      {saleCount} bonnen vandaag
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kassa tellen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="counted">Geteld bedrag</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      €
                    </span>
                    <Input
                      id="counted"
                      inputMode="decimal"
                      autoFocus
                      placeholder="0,00"
                      className="pl-7 tabular-nums"
                      value={countedInput}
                      onChange={(e) => setCountedInput(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Kasverschil</span>
                  {hasCounted ? (
                    <VarianceBadge cents={variance} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Opmerkingen</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    placeholder="Bijv. reden van verschil, extra uitgaves…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  disabled={!hasCounted || closing}
                  onClick={() => setConfirmOpen(true)}
                >
                  Kassa sluiten
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* History */}
      <div className="mt-8 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Geschiedenis</h2>
          <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Laatste 7 dagen</SelectItem>
              <SelectItem value="30">Laatste 30 dagen</SelectItem>
              <SelectItem value="90">Laatste 90 dagen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Envelop</TableHead>
                  <TableHead className="text-right">Openingsbedrag</TableHead>
                  <TableHead className="text-right">Verwacht</TableHead>
                  <TableHead className="text-right">Geteld</TableHead>
                  <TableHead>Verschil</TableHead>
                  <TableHead className="text-right">Bonnen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Nog geen gesloten kassa's
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => setDetail(row)}
                    >
                      <TableCell>{formatDateTimeNL(row.closed_at)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {row.envelope_number ? (
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="font-mono">
                              {row.envelope_number}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(row.envelope_number!)}
                              aria-label="Kopieer envelopnummer"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : canManageSequence ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={generatingFor === row.id}
                            onClick={() => handleGenerateEnvelope(row.id)}
                          >
                            {generatingFor === row.id ? "Bezig…" : "Genereer"}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatEUR(row.opening_float_cents)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatEUR(row.expected_cash_cents ?? 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatEUR(row.counted_cash_cents ?? 0)}
                      </TableCell>
                      <TableCell>
                        <VarianceBadge cents={row.variance_cents ?? 0} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.sale_count ?? 0}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kassa sluiten?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je de kassa wilt sluiten? Deze actie kan niet
              ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closing}>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose} disabled={closing}>
              {closing ? "Bezig…" : "Sluiten"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail drawer */}
      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full sm:max-w-[480px]">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>Kasafsluiting</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Gesloten op {formatDateTimeNL(detail.closed_at)}
                </p>
              </SheetHeader>

              <div className="mt-6 space-y-4 text-sm">
                {detail.envelope_number && (
                  <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
                    <span className="text-muted-foreground">Envelopnummer</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-sm">
                        {detail.envelope_number}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(detail.envelope_number!)}
                        aria-label="Kopieer envelopnummer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <VarianceBadge cents={detail.variance_cents ?? 0} />
                </div>

                <div className="space-y-2 rounded-md border border-border p-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Geopend</span>
                    <span>{formatDateTimeNL(detail.opened_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gesloten</span>
                    <span>{formatDateTimeNL(detail.closed_at)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Openingsbedrag</span>
                    <span className="tabular-nums">
                      {formatEUR(detail.opening_float_cents)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contante verkopen</span>
                    <span className="tabular-nums">
                      {formatEUR(detail.cash_sales_cents ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>PIN verkopen</span>
                    <span className="tabular-nums">
                      {formatEUR(detail.pin_sales_cents ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-medium">
                    <span>Verwacht in kassa</span>
                    <span className="tabular-nums">
                      {formatEUR(detail.expected_cash_cents ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Geteld</span>
                    <span className="tabular-nums">
                      {formatEUR(detail.counted_cash_cents ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground">Kasverschil</span>
                    <VarianceBadge cents={detail.variance_cents ?? 0} />
                  </div>
                </div>

                <div className="flex justify-between border-t border-border pt-3 text-muted-foreground">
                  <span>Bonnen</span>
                  <span className="tabular-nums">{detail.sale_count ?? 0}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Totaal omzet</span>
                  <span className="tabular-nums">
                    {formatEUR(detail.total_sales_cents ?? 0)}
                  </span>
                </div>

                {detail.notes && (
                  <div className="space-y-1 rounded-md border border-border p-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Opmerkingen
                    </div>
                    <p className={cn("whitespace-pre-wrap text-sm")}>
                      {detail.notes}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
