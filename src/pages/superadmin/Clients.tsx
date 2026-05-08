import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminClients, type AdminClient } from "@/hooks/useAdminDashboard";

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

function memberCount(client: AdminClient): number {
  const arr = client.org_members;
  if (!arr || arr.length === 0) return 0;
  return (arr[0]?.count as number | undefined) ?? 0;
}

export default function SuperAdminClients() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const { data, isLoading, error } = useAdminClients(page, PAGE_SIZE);
  const clients = data?.clients ?? [];
  const total = data?.total ?? 0;

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    );
  }, [clients, search]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Klanten</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? "…" : `${total} organisaties totaal`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Zoeken op naam of slug…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
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
              {search ? "Geen resultaten voor deze zoekopdracht." : "Geen klanten gevonden."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Aangemeld</TableHead>
                  <TableHead>Abonnement</TableHead>
                  <TableHead>Prijs</TableHead>
                  <TableHead>Setup fee</TableHead>
                  <TableHead className="text-right">Leden</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client) => {
                  const sub = client.subscriptions;
                  const statusKey = client.subscription_status ?? (sub?.status ?? null);
                  const statusMeta = statusKey
                    ? (SUB_STATUS[statusKey] ?? { label: statusKey, class: "bg-gray-100 text-gray-500" })
                    : null;
                  const price = sub?.price_cents
                    ? `${eur(sub.price_cents)}/${sub.billing_cycle === "yearly" ? "jr" : "mnd"}`
                    : "—";

                  return (
                    <TableRow key={client.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div>
                          <Link
                            to={`/superadmin/clients/${client.id}`}
                            className="font-medium hover:underline"
                          >
                            {client.name}
                          </Link>
                          <div className="text-xs text-muted-foreground">{client.slug}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(client.created_at), "d MMM yyyy", { locale: nl })}
                      </TableCell>
                      <TableCell>
                        {statusMeta ? (
                          <Badge className={`border-0 text-xs ${statusMeta.class}`}>
                            {statusMeta.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">{price}</TableCell>
                      <TableCell>
                        {client.setup_fee_paid ? (
                          <Badge className="border-0 bg-green-100 text-green-700 text-xs">
                            Betaald
                          </Badge>
                        ) : (
                          <Badge className="border-0 bg-orange-100 text-orange-700 text-xs">
                            Openstaand
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {memberCount(client)}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                          <Link to={`/superadmin/clients/${client.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
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
