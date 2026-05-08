import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Download, ExternalLink, Search, ChevronRight, ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useAdminInvoices } from "@/hooks/useAdminDashboard";

function eur(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
}

const INV_STATUS: Record<string, { label: string; class: string }> = {
  paid: { label: "Betaald", class: "bg-green-100 text-green-700" },
  open: { label: "Openstaand", class: "bg-yellow-100 text-yellow-700" },
  past_due: { label: "Achterstallig", class: "bg-red-100 text-red-700" },
  void: { label: "Geannuleerd", class: "bg-gray-100 text-gray-500" },
  refunded: { label: "Terugbetaald", class: "bg-gray-100 text-gray-500" },
};

const INV_KIND: Record<string, string> = {
  subscription: "Abonnement",
  setup_fee: "Setup-fee",
  one_off: "Eenmalig",
};

export default function SuperAdminInvoices() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const PAGE_SIZE = 50;

  const { data, isLoading, error } = useAdminInvoices(page, PAGE_SIZE);
  const invoices = data?.invoices ?? [];
  const total = data?.total ?? 0;

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const orgName = (inv.organizations as { name?: string } | null)?.name ?? "";
      const matchSearch =
        !search.trim() ||
        orgName.toLowerCase().includes(search.toLowerCase()) ||
        (inv.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, search, statusFilter]);

  // Running total of filtered results
  const filteredTotal = useMemo(
    () => filtered.reduce((s, i) => s + (i.amount_cents ?? 0), 0),
    [filtered],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Facturen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLoading ? "…" : `${total} facturen totaal`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Zoeken op klant of omschrijving…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statussen</SelectItem>
            <SelectItem value="open">Openstaand</SelectItem>
            <SelectItem value="paid">Betaald</SelectItem>
            <SelectItem value="past_due">Achterstallig</SelectItem>
            <SelectItem value="void">Geannuleerd</SelectItem>
          </SelectContent>
        </Select>

        {filtered.length > 0 && !isLoading && (
          <span className="ml-auto text-sm font-medium">
            Totaal: {eur(filteredTotal)}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Fout bij laden: {String(error)}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Geen facturen gevonden.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Klant</TableHead>
                  <TableHead>Omschrijving</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => {
                  const statusMeta = INV_STATUS[inv.status] ?? {
                    label: inv.status,
                    class: "bg-gray-100 text-gray-500",
                  };
                  const orgName =
                    (inv.organizations as { name?: string } | null)?.name ?? "—";
                  const downloadUrl = inv.invoice_pdf_url || inv.hosted_invoice_url;

                  return (
                    <TableRow key={inv.id} className="hover:bg-muted/40">
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(inv.created_at), "d MMM yyyy", { locale: nl })}
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/superadmin/clients/${inv.org_id}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {orgName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        {inv.description ?? INV_KIND[inv.kind] ?? inv.kind}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium text-sm">
                        {eur(inv.amount_cents)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`border-0 text-xs ${statusMeta.class}`}>
                          {statusMeta.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {downloadUrl ? (
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : inv.hosted_invoice_url ? (
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                            <a
                              href={inv.hosted_invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Pagina {page + 1} van {Math.ceil(total / PAGE_SIZE)}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Vorige
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Volgende
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
