import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ALLOWED_ORIGINS = new Set([
  "https://app.mydotts.nl",
  "https://dotts-backoffice-core.lovable.app",
]);
const ALLOWED_ORIGIN_RE =
  /^https:\/\/(?:[a-z0-9-]+--)?83a69c11-2366-4913-a015-a59c4201dd77\.lovable\.app$/i;

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allow = ALLOWED_ORIGINS.has(origin) || ALLOWED_ORIGIN_RE.test(origin);
  return {
    "Access-Control-Allow-Origin": allow ? origin : "https://app.mydotts.nl",
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsFor(req), "Content-Type": "application/json" },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEUR(cents: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format((cents ?? 0) / 100);
}

function formatPriceDelta(cents: number): string {
  if (cents === 0) return "";
  const sign = cents > 0 ? "+" : "−";
  return `${sign}${formatEUR(Math.abs(cents))}`;
}

function formatDateTimeNL(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(iso));
}

type OrgRow = Record<string, any>;
type SaleRow = Record<string, any>;
type SaleItemRow = Record<string, any>;
type PaymentRow = Record<string, any>;

function buildHtml(org: OrgRow, sale: SaleRow, items: SaleItemRow[], payment: PaymentRow | null, locationName: string | null): string {
  const showLogo = org.receipt_show_logo !== false && !!org.logo_url;
  const showAddress = org.receipt_show_address !== false;
  const showKvk = org.receipt_show_kvk !== false && !!org.kvk_number;
  const showVat = org.receipt_show_vat_number !== false && !!org.vat_number;
  const showContact = org.receipt_show_contact !== false;
  const accent = org.primary_color || "#0f172a";
  const headerName = org.legal_name || org.name || "";

  const addressLines: string[] = [];
  if (showAddress) {
    if (org.street) addressLines.push(org.street);
    const cityLine = [org.postal_code, org.city].filter(Boolean).join(" ");
    if (cityLine) addressLines.push(cityLine);
    if (org.country && org.country !== "NL") addressLines.push(org.country);
  }

  const contact: string[] = [];
  if (showContact) {
    if (org.phone) contact.push(org.phone);
    if (org.email) contact.push(org.email);
    if (org.website) contact.push(org.website);
  }

  const muted = "#6b7280";
  const fg = "#111111";
  const dashed = `border-top:1px dashed #d1d5db;margin:12px 0;`;
  const solid = `border-top:2px solid ${fg};margin:8px 0;`;
  const rowStyle = `display:flex;justify-content:space-between;gap:8px;`;
  const numStyle = `font-variant-numeric:tabular-nums;`;

  // Aggregate VAT by rate
  const taxByRate = new Map<number, number>();
  for (const it of items) {
    const rate = Number(it.tax_rate_bps_snapshot ?? 0);
    const vat = Number(it.line_tax_cents ?? 0);
    taxByRate.set(rate, (taxByRate.get(rate) ?? 0) + vat);
  }
  const tax_by_rate = Array.from(taxByRate.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([rate_bps, vat_cents]) => ({ rate_bps, vat_cents }));

  const parts: string[] = [];
  parts.push(`<!doctype html><html lang="nl"><body style="margin:0;padding:16px;background:#f5f5f5;">`);
  parts.push(
    `<div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;max-width:380px;margin:0 auto;padding:16px;background:#ffffff;color:${fg};font-size:12px;line-height:1.5;">`,
  );

  if (showLogo) {
    parts.push(
      `<div style="text-align:center;margin-bottom:12px;"><img src="${escapeHtml(org.logo_url)}" alt="" style="max-height:64px;max-width:64px;object-fit:contain;background:${escapeHtml(accent)}20;border-radius:6px;padding:4px;" /></div>`,
    );
  }

  if (headerName) {
    parts.push(
      `<p style="text-align:center;font-size:14px;font-weight:600;margin:0;">${escapeHtml(headerName)}</p>`,
    );
  }

  if (org.receipt_header) {
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
    const kvkLine = showKvk ? `<p style="margin:0;">KVK: ${escapeHtml(org.kvk_number)}</p>` : "";
    const vatLine = showVat ? `<p style="margin:0;">BTW: ${escapeHtml(org.vat_number)}</p>` : "";
    parts.push(
      `<div style="text-align:center;font-size:11px;color:${muted};margin-top:4px;">${kvkLine}${vatLine}</div>`,
    );
  }

  if (contact.length > 0) {
    parts.push(
      `<div style="text-align:center;font-size:11px;color:${muted};margin-top:4px;">${contact.map((c) => `<p style="margin:0;">${escapeHtml(c)}</p>`).join("")}</div>`,
    );
  }

  if (locationName) {
    parts.push(
      `<p style="text-align:center;font-size:11px;color:${muted};margin:8px 0 0 0;">${escapeHtml(locationName)}</p>`,
    );
  }

  parts.push(`<div style="${dashed}"></div>`);
  parts.push(
    `<div style="text-align:center;"><p style="margin:0;font-weight:600;">Bon ${escapeHtml(sale.receipt_number ?? sale.id)}</p><p style="margin:0;color:${muted};">${escapeHtml(formatDateTimeNL(sale.created_at))}</p></div>`,
  );
  parts.push(`<div style="${dashed}"></div>`);

  parts.push(`<ul style="list-style:none;margin:0;padding:0;">`);
  for (const it of items) {
    const qty = Number(it.quantity ?? 1);
    const unit = Number(it.price_cents_snapshot ?? 0);
    const lineTotal = Number(it.line_total_cents ?? unit * qty);
    const mods = Array.isArray(it.modifiers) ? (it.modifiers as { name: string; price_cents: number }[]) : [];
    const modSum = mods.reduce((s, m) => s + Number(m.price_cents ?? 0), 0);
    const baseUnit = unit - modSum;
    parts.push(`<li style="margin-bottom:8px;">`);
    parts.push(
      `<div style="${rowStyle}"><span>${qty}× ${escapeHtml(it.name_snapshot ?? "")}${it.variant_name ? ` · ${escapeHtml(it.variant_name)}` : ""}</span><span style="${numStyle}">${escapeHtml(formatEUR(baseUnit))}</span></div>`,
    );
    for (const m of mods) {
      const priceTxt = Number(m.price_cents) === 0 ? "" : formatPriceDelta(Number(m.price_cents));
      parts.push(
        `<div style="${rowStyle}padding-left:16px;color:${muted};"><span>+ ${escapeHtml(m.name)}</span><span style="${numStyle}">${escapeHtml(priceTxt)}</span></div>`,
      );
    }
    parts.push(
      `<div style="display:flex;justify-content:flex-end;padding-top:2px;"><span style="${numStyle}font-weight:600;">${escapeHtml(formatEUR(lineTotal))}</span></div>`,
    );
    parts.push(`</li>`);
  }
  parts.push(`</ul>`);
  parts.push(`<div style="${dashed}"></div>`);

  parts.push(
    `<div style="${rowStyle}"><span style="color:${muted};">Subtotaal (excl. BTW)</span><span style="${numStyle}">${escapeHtml(formatEUR(Number(sale.subtotal_cents ?? 0)))}</span></div>`,
  );
  for (const t of tax_by_rate) {
    parts.push(
      `<div style="${rowStyle}margin-top:4px;"><span style="color:${muted};">BTW ${(t.rate_bps / 100).toFixed(0)}%</span><span style="${numStyle}">${escapeHtml(formatEUR(t.vat_cents))}</span></div>`,
    );
  }

  parts.push(`<div style="${solid}"></div>`);
  parts.push(
    `<div style="${rowStyle}font-size:14px;font-weight:700;"><span>Totaal</span><span style="${numStyle}">${escapeHtml(formatEUR(Number(sale.total_cents ?? 0)))}</span></div>`,
  );
  parts.push(`<div style="${dashed}"></div>`);

  if (payment) {
    if (payment.method === "cash") {
      parts.push(
        `<div style="${rowStyle}"><span style="color:${muted};">Contant ontvangen</span><span style="${numStyle}">${escapeHtml(formatEUR(Number(payment.tendered_cents ?? 0)))}</span></div>`,
      );
      parts.push(
        `<div style="${rowStyle}margin-top:4px;"><span style="color:${muted};">Wisselgeld</span><span style="${numStyle}">${escapeHtml(formatEUR(Number(payment.change_cents ?? 0)))}</span></div>`,
      );
    } else {
      parts.push(
        `<div style="${rowStyle}"><span style="color:${muted};">Betaald met PIN</span><span style="${numStyle}">${escapeHtml(formatEUR(Number(payment.amount_cents ?? sale.total_cents ?? 0)))}</span></div>`,
      );
    }
  }

  if (org.receipt_footer) {
    parts.push(`<div style="${dashed}"></div>`);
    parts.push(
      `<p style="text-align:center;font-size:11px;color:${muted};white-space:pre-line;margin:0;">${escapeHtml(org.receipt_footer)}</p>`,
    );
  }

  parts.push(`</div></body></html>`);
  return parts.join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const brevoKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoKey) {
      return json({ error: "brevo_not_configured" }, 500);
    }

    // Identify caller via JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "unauthorized" }, 401);
    }
    const userId = userData.user.id;

    // Parse + validate body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }
    const saleId = typeof body?.sale_id === "string" ? body.sale_id.trim() : "";
    const recipientEmail =
      typeof body?.recipient_email === "string" ? body.recipient_email.trim() : "";
    if (!saleId) return json({ error: "sale_id_required" }, 400);
    if (!recipientEmail || !EMAIL_RE.test(recipientEmail) || recipientEmail.length > 254) {
      return json({ error: "invalid_email" }, 400);
    }

    // Fetch sale + org + items + payment with service role, then enforce membership
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: sale, error: saleErr } = await admin
      .from("sales")
      .select("*")
      .eq("id", saleId)
      .maybeSingle();
    if (saleErr) {
      console.error("sale fetch error", saleErr);
      return json({ error: "sale_not_found" }, 404);
    }
    if (!sale) return json({ error: "sale_not_found" }, 404);

    const { data: membership } = await admin
      .from("org_members")
      .select("user_id")
      .eq("org_id", sale.org_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!membership) {
      return json({ error: "forbidden" }, 403);
    }

    const [{ data: org }, { data: items }, { data: payments }, { data: location }] =
      await Promise.all([
        admin.from("organizations").select("*").eq("id", sale.org_id).maybeSingle(),
        admin.from("sale_items").select("*").eq("sale_id", saleId).order("created_at", { ascending: true }),
        admin.from("payments").select("*").eq("sale_id", saleId).limit(1),
        sale.location_id
          ? admin.from("locations").select("name").eq("id", sale.location_id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

    if (!org) return json({ error: "org_not_found" }, 404);

    const html = buildHtml(
      org as OrgRow,
      sale as SaleRow,
      (items ?? []) as SaleItemRow[],
      ((payments && payments[0]) ?? null) as PaymentRow | null,
      (location?.name as string | undefined) ?? null,
    );

    const orgLabel = (org.name as string | undefined) ?? "Dotts";
    const subject = `Bon ${sale.receipt_number ?? sale.id} — ${orgLabel}`;

    // Send via Brevo
    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: orgLabel.slice(0, 70), email: "noreply@mydotts.nl" },
        to: [{ email: recipientEmail }],
        subject,
        htmlContent: html,
      }),
    });

    if (!brevoRes.ok) {
      const txt = await brevoRes.text();
      console.error("brevo failed", brevoRes.status, txt);
      return json({ error: "brevo_failed" }, 502);
    }

    await admin
      .from("sales")
      .update({
        receipt_emailed_at: new Date().toISOString(),
        receipt_emailed_to: recipientEmail,
      })
      .eq("id", saleId);

    return json({ ok: true });
  } catch (e) {
    console.error("email-receipt fatal", e);
    return json({ error: "internal_error" }, 500);
  }
});