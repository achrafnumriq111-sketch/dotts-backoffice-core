import type { OrgFull } from "@/context/OrgContext";
import { formatEUR } from "@/lib/i18n";
import { formatPriceDelta } from "@/lib/eur";
import type { ReceiptSale } from "@/components/receipt/ReceiptView";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDateTimeNL(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
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

function buildContact(org: Partial<OrgFull> | null): string[] {
  if (!org) return [];
  const parts: string[] = [];
  if (org.phone) parts.push(org.phone);
  if (org.email) parts.push(org.email);
  if (org.website) parts.push(org.website);
  return parts;
}

/**
 * Build a self-contained HTML email body that visually matches the in-app
 * ReceiptView. All styles are inline so they survive most email clients.
 */
export function buildReceiptHtml(
  org: Partial<OrgFull> | null,
  sale: ReceiptSale,
): string {
  const showLogo = org?.receipt_show_logo !== false && !!org?.logo_url;
  const showAddress = org?.receipt_show_address !== false;
  const showKvk = org?.receipt_show_kvk !== false && !!org?.kvk_number;
  const showVat = org?.receipt_show_vat_number !== false && !!org?.vat_number;
  const showContact = org?.receipt_show_contact !== false;
  const accent = org?.primary_color || "#0f172a";

  const headerName = org?.legal_name || org?.name || "";
  const addressLines = showAddress ? buildAddress(org) : [];
  const contact = showContact ? buildContact(org) : [];

  const muted = "#6b7280";
  const fg = "#111111";
  const dashed = `border-top:1px dashed #d1d5db;margin:12px 0;`;
  const solid = `border-top:2px solid ${fg};margin:8px 0;`;
  const rowStyle = `display:flex;justify-content:space-between;gap:8px;`;
  const numStyle = `font-variant-numeric:tabular-nums;`;

  const parts: string[] = [];

  parts.push(
    `<div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;max-width:380px;margin:0 auto;padding:16px;background:#ffffff;color:${fg};font-size:12px;line-height:1.5;">`,
  );

  if (showLogo) {
    parts.push(
      `<div style="text-align:center;margin-bottom:12px;"><img src="${escapeHtml(org!.logo_url!)}" alt="" style="max-height:64px;max-width:64px;object-fit:contain;background:${escapeHtml(accent)}20;border-radius:6px;padding:4px;" /></div>`,
    );
  }

  if (headerName) {
    parts.push(
      `<p style="text-align:center;font-size:14px;font-weight:600;margin:0;">${escapeHtml(headerName)}</p>`,
    );
  }

  if (org?.receipt_header) {
    parts.push(
      `<p style="text-align:center;font-size:11px;color:${muted};margin:4px 0 0 0;white-space:pre-line;">${escapeHtml(org.receipt_header)}</p>`,
    );
  }

  if (addressLines.length > 0) {
    parts.push(
      `<div style="text-align:center;font-size:11px;color:${muted};margin-top:8px;">${addressLines.map((l) => `<p style="margin:0;">${escapeHtml(l)}</p>`).join("")}</div>`,
    );
  }

  if (showKvk || showVat) {
    const kvkLine = showKvk ? `<p style="margin:0;">KVK: ${escapeHtml(org!.kvk_number!)}</p>` : "";
    const vatLine = showVat ? `<p style="margin:0;">BTW: ${escapeHtml(org!.vat_number!)}</p>` : "";
    parts.push(
      `<div style="text-align:center;font-size:11px;color:${muted};margin-top:4px;">${kvkLine}${vatLine}</div>`,
    );
  }

  if (contact.length > 0) {
    parts.push(
      `<div style="text-align:center;font-size:11px;color:${muted};margin-top:4px;">${contact.map((c) => `<p style="margin:0;">${escapeHtml(c)}</p>`).join("")}</div>`,
    );
  }

  if (sale.location_name) {
    parts.push(
      `<p style="text-align:center;font-size:11px;color:${muted};margin:8px 0 0 0;">${escapeHtml(sale.location_name)}</p>`,
    );
  }

  parts.push(`<div style="${dashed}"></div>`);

  parts.push(
    `<div style="text-align:center;"><p style="margin:0;font-weight:600;">Bon ${escapeHtml(sale.receipt_number)}</p><p style="margin:0;color:${muted};">${escapeHtml(formatDateTimeNL(sale.created_at))}</p></div>`,
  );

  parts.push(`<div style="${dashed}"></div>`);

  // Items
  parts.push(`<ul style="list-style:none;margin:0;padding:0;">`);
  for (const line of sale.lines) {
    const baseUnit =
      line.unitPriceCents -
      line.modifiers.reduce((s, m) => s + m.price_cents, 0);
    parts.push(`<li style="margin-bottom:8px;">`);
    parts.push(
      `<div style="${rowStyle}"><span>${line.quantity}× ${escapeHtml(line.productName)}${line.variantName ? ` · ${escapeHtml(line.variantName)}` : ""}</span><span style="${numStyle}">${escapeHtml(formatEUR(baseUnit))}</span></div>`,
    );
    for (const m of line.modifiers) {
      const priceTxt = m.price_cents === 0 ? "" : formatPriceDelta(m.price_cents);
      parts.push(
        `<div style="${rowStyle}padding-left:16px;color:${muted};"><span>+ ${escapeHtml(m.name)}</span><span style="${numStyle}">${escapeHtml(priceTxt)}</span></div>`,
      );
    }
    parts.push(
      `<div style="display:flex;justify-content:flex-end;padding-top:2px;"><span style="${numStyle}font-weight:600;">${escapeHtml(formatEUR(line.lineTotalCents))}</span></div>`,
    );
    parts.push(`</li>`);
  }
  parts.push(`</ul>`);

  parts.push(`<div style="${dashed}"></div>`);

  // Totals
  parts.push(
    `<div style="${rowStyle}"><span style="color:${muted};">Subtotaal (excl. BTW)</span><span style="${numStyle}">${escapeHtml(formatEUR(sale.subtotal_cents))}</span></div>`,
  );
  for (const t of sale.tax_by_rate) {
    parts.push(
      `<div style="${rowStyle}margin-top:4px;"><span style="color:${muted};">BTW ${(t.rate_bps / 100).toFixed(0)}%</span><span style="${numStyle}">${escapeHtml(formatEUR(t.vat_cents))}</span></div>`,
    );
  }

  parts.push(`<div style="${solid}"></div>`);

  parts.push(
    `<div style="${rowStyle}font-size:14px;font-weight:700;"><span>Totaal</span><span style="${numStyle}">${escapeHtml(formatEUR(sale.total_cents))}</span></div>`,
  );

  parts.push(`<div style="${dashed}"></div>`);

  if (sale.payment.method === "cash") {
    parts.push(
      `<div style="${rowStyle}"><span style="color:${muted};">Contant ontvangen</span><span style="${numStyle}">${escapeHtml(formatEUR(sale.payment.tendered_cents ?? 0))}</span></div>`,
    );
    parts.push(
      `<div style="${rowStyle}margin-top:4px;"><span style="color:${muted};">Wisselgeld</span><span style="${numStyle}">${escapeHtml(formatEUR(sale.payment.change_cents ?? 0))}</span></div>`,
    );
  } else {
    parts.push(
      `<div style="${rowStyle}"><span style="color:${muted};">Betaald met PIN</span><span style="${numStyle}">${escapeHtml(formatEUR(sale.payment.amount_cents))}</span></div>`,
    );
  }

  if (org?.receipt_footer) {
    parts.push(`<div style="${dashed}"></div>`);
    parts.push(
      `<p style="text-align:center;font-size:11px;color:${muted};white-space:pre-line;margin:0;">${escapeHtml(org.receipt_footer)}</p>`,
    );
  } else {
    parts.push(`<div style="${dashed}"></div>`);
    parts.push(
      `<p style="text-align:center;font-size:11px;color:${muted};margin:0;">Bedankt voor je aankoop!</p>`,
    );
  }

  parts.push(`</div>`);

  return parts.join("");
}