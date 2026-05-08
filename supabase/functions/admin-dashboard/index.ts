/**
 * admin-dashboard edge function
 * All actions require the caller to be a Dotts super-admin.
 * Uses service-role key to bypass RLS and query across all orgs.
 */
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
    Vary: "Origin",
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsFor(req) });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json(req, { error: "unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Identify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json(req, { error: "unauthorized" }, 401);
    }
    const userId = userData.user.id;

    // Service-role client — bypasses all RLS
    const admin = createClient(supabaseUrl, serviceKey);

    // Verify super-admin
    const { data: saRow } = await admin
      .from("super_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!saRow) {
      return json(req, { error: "forbidden" }, 403);
    }

    // Parse action
    let body: { action?: string; org_id?: string; page?: number; limit?: number } = {};
    try {
      body = await req.json();
    } catch {
      return json(req, { error: "invalid_json" }, 400);
    }

    const action = body.action ?? "overview";

    // ------------------------------------------------------------------
    if (action === "overview") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [
        { count: totalOrgs },
        { count: activeSubscriptions },
        { count: newOrgsThisMonth },
        { count: overdueInvoices },
        { data: recentOrgs },
        { data: mrrData },
      ] = await Promise.all([
        admin.from("organizations").select("id", { count: "exact", head: true }),
        admin
          .from("subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        admin
          .from("organizations")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startOfMonth),
        admin
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("status", "past_due"),
        admin
          .from("organizations")
          .select("id, name, slug, created_at, subscription_status, setup_fee_paid")
          .order("created_at", { ascending: false })
          .limit(8),
        admin
          .from("subscriptions")
          .select("price_cents, billing_cycle")
          .eq("status", "active"),
      ]);

      // Calculate MRR: monthly subs as-is, yearly / 12
      const mrr = (mrrData ?? []).reduce((sum, s) => {
        const cents = s.price_cents ?? 0;
        return sum + (s.billing_cycle === "yearly" ? Math.round(cents / 12) : cents);
      }, 0);

      return json(req, {
        totalOrgs: totalOrgs ?? 0,
        activeSubscriptions: activeSubscriptions ?? 0,
        newOrgsThisMonth: newOrgsThisMonth ?? 0,
        overdueInvoices: overdueInvoices ?? 0,
        mrrCents: mrr,
        recentOrgs: recentOrgs ?? [],
      });
    }

    // ------------------------------------------------------------------
    if (action === "clients") {
      const pageSize = Math.min(body.limit ?? 50, 100);
      const page = Math.max(body.page ?? 0, 0);

      const { data, count, error } = await admin
        .from("organizations")
        .select(
          `id, name, slug, created_at, subscription_status, setup_fee_paid, setup_fee_paid_at,
           subscriptions(status, price_cents, billing_cycle, current_period_end, plans(name)),
           org_members(count)`,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);

      if (error) {
        console.error("clients fetch failed", error);
        return json(req, { error: "db_error" }, 500);
      }

      return json(req, { clients: data ?? [], total: count ?? 0, page, pageSize });
    }

    // ------------------------------------------------------------------
    if (action === "client_detail") {
      const orgId = body.org_id;
      if (!orgId) return json(req, { error: "org_id_required" }, 400);

      const [
        { data: org },
        { data: subscription },
        { data: invoices },
        { data: members },
        { data: employeeCount },
        { data: saleCount },
      ] = await Promise.all([
        admin.from("organizations").select("*").eq("id", orgId).maybeSingle(),
        admin
          .from("subscriptions")
          .select("*, plans(name, currency)")
          .eq("org_id", orgId)
          .maybeSingle(),
        admin
          .from("invoices")
          .select(
            "id, created_at, description, kind, amount_cents, status, hosted_invoice_url, invoice_pdf_url",
          )
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .limit(50),
        admin
          .from("org_members")
          .select("user_id, role, created_at")
          .eq("org_id", orgId)
          .order("created_at", { ascending: true }),
        admin
          .from("employees")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("is_active", true),
        admin
          .from("sales")
          .select("id", { count: "exact", head: true })
          .eq("org_id", orgId)
          .eq("voided", false),
      ]);

      if (!org) return json(req, { error: "org_not_found" }, 404);

      // Fetch auth emails for members using service role
      const memberUserIds = (members ?? []).map((m) => m.user_id);
      let memberEmails: Record<string, string> = {};
      if (memberUserIds.length > 0) {
        // admin.auth.admin.listUsers does not support filtering by id array,
        // so we use the users table via service role
        const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
        for (const u of authUsers?.users ?? []) {
          if (memberUserIds.includes(u.id)) {
            memberEmails[u.id] = u.email ?? "";
          }
        }
      }

      const membersWithEmail = (members ?? []).map((m) => ({
        ...m,
        email: memberEmails[m.user_id] ?? null,
      }));

      return json(req, {
        org,
        subscription,
        invoices: invoices ?? [],
        members: membersWithEmail,
        employeeCount: (employeeCount as { count?: number } | null)?.count ?? 0,
        saleCount: (saleCount as { count?: number } | null)?.count ?? 0,
      });
    }

    // ------------------------------------------------------------------
    if (action === "invoices") {
      const pageSize = Math.min(body.limit ?? 50, 100);
      const page = Math.max(body.page ?? 0, 0);

      const { data, count, error } = await admin
        .from("invoices")
        .select(
          `id, created_at, description, kind, amount_cents, status,
           hosted_invoice_url, invoice_pdf_url, org_id,
           organizations(name)`,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);

      if (error) {
        console.error("invoices fetch failed", error);
        return json(req, { error: "db_error" }, 500);
      }

      return json(req, { invoices: data ?? [], total: count ?? 0, page, pageSize });
    }

    return json(req, { error: "unknown_action" }, 400);
  } catch (e) {
    console.error("admin-dashboard fatal", e);
    return json(req, { error: "internal_error" }, 500);
  }
});
