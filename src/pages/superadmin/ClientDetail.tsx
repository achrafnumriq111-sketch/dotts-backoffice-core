import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { ArrowLeft, Download, ExternalLink, Users, Receipt, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminClientDetail } from "@/hooks/useAdminDashboard";

function eur(cents: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
}

function dateNL(iso: string | null | undefined) {
  if (!iso) return "—";
  return format(new Date(iso), "d MMM yyyy", { locale: nl });
}

function dateTimeNL(iso: string | null | undefined) {
  if (!iso) return "—";
  return format(new Date(iso), "d MMM yyyy HH:mm", { locale: nl });
}

const SUB_STATUS: Record<string, { label: string; class: string }> = {
  active: { label: "Actief", class: "bg-green-100 text-green-700" },
  past_due: { label: "Achterstallig", class: "bg-red-100 text-red-700" },
  paused: { label: "Gepauzeerd", class: "bg-yellow-100 text-yellow-700" },
  canceled: { label: "Beëindigd", class: "bg-gray-100 text-gray-500" },
  pending_setup: { label: "Setup vereist", class: "bg-orange-100 text-orange-700" },
};

const INV_STATUS: Record<string, { label: string; class: string }> = {
  paid: { label: "Betaald", class: "bg-green-100 text-green-700" },
  open: { label: "Openstaand", class: "bg-yellow-100 text-yellow-700" },
  past_due: { label: "Achterstallig", class: "bg-red-100 text-red-700" },
  void: { label: "Geannuleerd", class: "bg-gray-100 text-gray-500" },
  refunded: { label: "Terugbetaald", class: "bg-gray-100 text-gray-500" },
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Eigenaar",
  admin: "Admin",
  manager: "Manager",
  staff: "Medewerker",
};

const INV_KIND: Record<string, string> = {
  subscription: "Abonnement",
  setup_fee: "Setup-fee",
  one_off: "Eenmalig",
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b border-border py-2.5 last:border-0 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 font-medium">{value ?? "—"}</dd>
    </div>
  );
}

export default function SuperAdminClientDetail() {
  const { orgId } = useParams<{ orgId: string }>();
  const { data, isLoading, error } = useAdminClientDetail(orgId ?? null);

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          to="/superadmin/clients"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Terug
        </Link>
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Fout: {String(error)}
        </div>
      </div>
    );
  }

  const org = data?.org as Record<string, unknown> | undefined;
  const sub = data?.subscription as Record<string, unknown> | null | undefined;
  const subStatus = (org?.subscription_status as string | null) ?? null;
  const subStatusMeta = subStatus ? (SUB_STATUS[subStatus] ?? null) : null;

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div>
        <Link
          to="/superadmin/clients"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Alle klanten
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {isLoading ? "…" : String(org?.name ?? "").slice(0, 2).toUpperCase()}
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              <h1 className="text-xl font-semibold">{String(org?.name ?? "")}</h1>
            )}
            <p className="text-sm text-muted-foreground">{String(org?.slug ?? "")}</p>
          </div>
        </div>
      </div>

      {/* Stat chips */}
      {!isLoading && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{data?.employeeCount ?? 0} medewerkers</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
            <Receipt className="h-4 w-4 text-muted-foreground" />
            <span>{data?.saleCount ?? 0} verkopen</span>
          </div>
          {subStatusMeta && (
            <Badge className={`border-0 ${subStatusMeta.class}`}>
              {subStatusMeta.label}
            </Badge>
          )}
          {org?.setup_fee_paid ? (
            <Badge className="border-0 bg-green-100 text-green-700">Setup fee betaald</Badge>
          ) : (
            <Badge className="border-0 bg-orange-100 text-orange-700">Setup fee open</Badge>
          )}
        </div>
      )}

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="subscription">Abonnement</TabsTrigger>
          <TabsTrigger value="members">Leden</TabsTrigger>
          <TabsTrigger value="invoices">Facturen</TabsTrigger>
        </TabsList>

        {/* ---- INFO ---- */}
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <dl>
                  <Field label="Naam" value={String(org?.name ?? "")} />
                  <Field label="Juridische naam" value={org?.legal_name as string | null} />
                  <Field label="Slug" value={String(org?.slug ?? "")} />
                  <Field label="KVK" value={org?.kvk_number as string | null} />
                  <Field label="BTW" value={org?.vat_number as string | null} />
                  <Field
                    label="Adres"
                    value={[org?.street, org?.postal_code, org?.city]
                      .filter(Boolean)
                      .join(", ") || null}
                  />
                  <Field label="E-mail" value={org?.email as string | null} />
                  <Field label="Telefoon" value={org?.phone as string | null} />
                  <Field label="Website" value={org?.website as string | null} />
                  <Field label="Aangemeld op" value={dateTimeNL(org?.created_at as string)} />
                </dl>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- SUBSCRIPTION ---- */}
        <TabsContent value="subscription" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : sub ? (
                <dl>
                  <Field
                    label="Plan"
                    value={(sub?.plans as { name?: string } | null)?.name ?? "—"}
                  />
                  <Field
                    label="Status"
                    value={
                      subStatusMeta ? (
                        <Badge className={`border-0 ${subStatusMeta.class}`}>
                          {subStatusMeta.label}
                        </Badge>
                      ) : (
                        String(sub?.status ?? "—")
                      )
                    }
                  />
                  <Field
                    label="Prijs"
                    value={
                      sub?.price_cents
                        ? `${eur(sub.price_cents as number)}/${
                            sub.billing_cycle === "yearly" ? "jaar" : "maand"
                          }`
                        : "—"
                    }
                  />
                  <Field label="Volgende verlenging" value={dateNL(sub?.current_period_end as string)} />
                  <Field
                    label="Setup fee"
                    value={
                      org?.setup_fee_paid ? (
                        <span className="text-green-700">
                          Betaald op {dateNL(org?.setup_fee_paid_at as string)}
                        </span>
                      ) : (
                        <span className="text-orange-700">Nog niet betaald</span>
                      )
                    }
                  />
                  <Field label="Contract tot" value={dateNL(sub?.contract_min_end_at as string)} />
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">Geen abonnement gevonden.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- MEMBERS ---- */}
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (data?.members ?? []).length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">Geen leden.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Lid sinds</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.members ?? []).map((m) => (
                      <TableRow key={m.user_id}>
                        <TableCell className="font-medium">
                          {m.email ?? (
                            <span className="text-muted-foreground text-xs">
                              {m.user_id.slice(0, 8)}…
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {ROLE_LABELS[m.role] ?? m.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {dateNL(m.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- INVOICES ---- */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (data?.invoices ?? []).length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">Nog geen facturen.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Omschrijving</TableHead>
                      <TableHead className="text-right">Bedrag</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.invoices ?? []).map((inv) => {
                      const invStatus = INV_STATUS[inv.status] ?? {
                        label: inv.status,
                        class: "bg-gray-100 text-gray-500",
                      };
                      const downloadUrl = inv.invoice_pdf_url || inv.hosted_invoice_url;
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="text-muted-foreground">
                            {dateNL(inv.created_at)}
                          </TableCell>
                          <TableCell>
                            {inv.description ?? INV_KIND[inv.kind] ?? inv.kind}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {eur(inv.amount_cents)}
                          </TableCell>
                          <TableCell>
                            <Badge className={`border-0 text-xs ${invStatus.class}`}>
                              {invStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {downloadUrl ? (
                              <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                                <a
                                  href={downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
