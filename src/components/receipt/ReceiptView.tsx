import type { OrgFull } from "@/context/OrgContext";
import { formatEUR } from "@/lib/i18n";
import { formatPriceDelta } from "@/lib/eur";

function formatDateTimeNL(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export interface ReceiptLine {
  key: string;
  quantity: number;
  productName: string;
  variantName?: string | null;
  unitPriceCents: number;
  lineTotalCents: number;
  modifiers: { name: string; price_cents: number }[];
}

export interface ReceiptSale {
  receipt_number: string;
  created_at: string;
  subtotal_cents: number;
  total_cents: number;
  tax_by_rate: { rate_bps: number; vat_cents: number }[];
  lines: ReceiptLine[];
  payment: {
    method: "cash" | "pin";
    amount_cents: number;
    tendered_cents?: number | null;
    change_cents?: number | null;
  };
  location_name?: string | null;
}

function buildContact(org: Partial<OrgFull> | null): string[] {
  if (!org) return [];
  const parts: string[] = [];
  if (org.phone) parts.push(org.phone);
  if (org.email) parts.push(org.email);
  if (org.website) parts.push(org.website);
  return parts;
}

function buildAddress(org: Partial<OrgFull> | null): string[] {
  if (!org) return [];
  const lines: string[] = [];
  if (org.street) lines.push(org.street);
  const cityLine = [org.postal_code, org.city].filter(Boolean).join(" ");
  if (cityLine) lines.push(cityLine);
  if (org.country && org.country !== "NL") lines.push(org.country);
  return lines;
}

interface Props {
  org: Partial<OrgFull> | null;
  sale: ReceiptSale;
  className?: string;
}

export function ReceiptView({ org, sale, className }: Props) {
  const showLogo = org?.receipt_show_logo !== false && !!org?.logo_url;
  const showAddress = org?.receipt_show_address !== false;
  const showKvk = org?.receipt_show_kvk !== false && !!org?.kvk_number;
  const showVat = org?.receipt_show_vat_number !== false && !!org?.vat_number;
  const showContact = org?.receipt_show_contact !== false;
  const accent = org?.primary_color || "hsl(var(--primary))";

  const headerName = org?.legal_name || org?.name || "";
  const addressLines = showAddress ? buildAddress(org) : [];
  const contact = showContact ? buildContact(org) : [];

  return (
    <div
      className={
        "rounded-md border border-border bg-card p-4 font-mono text-xs text-foreground shadow-sm " +
        (className ?? "")
      }
      style={{ maxWidth: 380 }}
    >
      {showLogo && (
        <div className="mb-3 flex justify-center">
          <div
            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md"
            style={{ backgroundColor: accent + "20" }}
          >
            <img
              src={org!.logo_url!}
              alt=""
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      )}

      {headerName && (
        <p className="text-center text-sm font-semibold">{headerName}</p>
      )}

      {org?.receipt_header && (
        <p className="mt-1 whitespace-pre-line text-center text-[11px] text-muted-foreground">
          {org.receipt_header}
        </p>
      )}

      {addressLines.length > 0 && (
        <div className="mt-2 text-center text-[11px] text-muted-foreground">
          {addressLines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
      )}

      {(showKvk || showVat) && (
        <div className="mt-1 text-center text-[11px] text-muted-foreground">
          {showKvk && <p>KVK: {org!.kvk_number}</p>}
          {showVat && <p>BTW: {org!.vat_number}</p>}
        </div>
      )}

      {contact.length > 0 && (
        <div className="mt-1 text-center text-[11px] text-muted-foreground">
          {contact.map((c, i) => (
            <p key={i}>{c}</p>
          ))}
        </div>
      )}

      {sale.location_name && (
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {sale.location_name}
        </p>
      )}

      <div className="my-3 border-t border-dashed border-border" />

      <div className="text-center">
        <p className="font-semibold">Bon {sale.receipt_number}</p>
        <p className="text-muted-foreground">{formatDateTimeNL(sale.created_at)}</p>
      </div>

      <div className="my-3 border-t border-dashed border-border" />

      <ul className="space-y-2">
        {sale.lines.map((line) => {
          const baseUnit =
            line.unitPriceCents -
            line.modifiers.reduce((s, m) => s + m.price_cents, 0);
          return (
            <li key={line.key}>
              <div className="flex justify-between gap-2">
                <span className="truncate">
                  {line.quantity}× {line.productName}
                  {line.variantName ? ` · ${line.variantName}` : ""}
                </span>
                <span className="tabular-nums">{formatEUR(baseUnit)}</span>
              </div>
              {line.modifiers.map((m, i) => (
                <div
                  key={i}
                  className="flex justify-between gap-2 pl-4 text-muted-foreground"
                >
                  <span className="truncate">+ {m.name}</span>
                  <span className="tabular-nums">
                    {m.price_cents === 0 ? "" : formatPriceDelta(m.price_cents)}
                  </span>
                </div>
              ))}
              <div className="flex justify-end pt-0.5">
                <span className="tabular-nums font-semibold">
                  {formatEUR(line.lineTotalCents)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="my-3 border-t border-dashed border-border" />

      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotaal (excl. BTW)</span>
          <span className="tabular-nums">{formatEUR(sale.subtotal_cents)}</span>
        </div>
        {sale.tax_by_rate.map((t) => (
          <div key={t.rate_bps} className="flex justify-between">
            <span className="text-muted-foreground">
              BTW {(t.rate_bps / 100).toFixed(0)}%
            </span>
            <span className="tabular-nums">{formatEUR(t.vat_cents)}</span>
          </div>
        ))}
      </div>

      <div className="my-2 border-t-2 border-foreground" />

      <div className="flex justify-between text-sm font-bold">
        <span>Totaal</span>
        <span className="tabular-nums">{formatEUR(sale.total_cents)}</span>
      </div>

      <div className="my-3 border-t border-dashed border-border" />

      {sale.payment.method === "cash" ? (
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contant ontvangen</span>
            <span className="tabular-nums">
              {formatEUR(sale.payment.tendered_cents ?? 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Wisselgeld</span>
            <span className="tabular-nums">
              {formatEUR(sale.payment.change_cents ?? 0)}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Betaald met PIN</span>
          <span className="tabular-nums">{formatEUR(sale.payment.amount_cents)}</span>
        </div>
      )}

      {org?.receipt_footer && (
        <>
          <div className="my-3 border-t border-dashed border-border" />
          <p className="whitespace-pre-line text-center text-[11px] text-muted-foreground">
            {org.receipt_footer}
          </p>
        </>
      )}
    </div>
  );
}