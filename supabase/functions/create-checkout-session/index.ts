/**
 * create-checkout-session
 * Creates a Stripe Checkout session for the setup-fee payment.
 *
 * Required Supabase secrets (set via `supabase secrets set`):
 *   STRIPE_SECRET_KEY   — your Stripe secret key (sk_live_... or sk_test_...)
 *   STRIPE_SETUP_FEE_PRICE_ID — the Stripe Price ID for the setup fee product
 *
 * The session redirects back to /abonnement?checkout=success|cancel
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const priceId = Deno.env.get("STRIPE_PRICE_SETUP");

    if (!stripeKey || !priceId) {
      console.error("Stripe env vars missing");
      return json(req, { error: "stripe_not_configured" }, 500);
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

    // Parse body
    let body: { org_id?: string } = {};
    try {
      body = await req.json();
    } catch {
      return json(req, { error: "invalid_json" }, 400);
    }

    const orgId = body.org_id;
    if (!orgId) return json(req, { error: "org_id_required" }, 400);

    // Verify the caller is owner/admin of this org
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: membership } = await admin
      .from("org_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", userData.user.id)
      .in("role", ["owner", "admin"])
      .maybeSingle();

    if (!membership) {
      return json(req, { error: "forbidden" }, 403);
    }

    // Fetch org for metadata
    const { data: org } = await admin
      .from("organizations")
      .select("name, email")
      .eq("id", orgId)
      .maybeSingle();

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // Determine app base URL from request origin
    const origin = req.headers.get("origin") ?? "https://app.mydotts.nl";
    const appBase = ALLOWED_ORIGINS.has(origin) || ALLOWED_ORIGIN_RE.test(origin)
      ? origin
      : "https://app.mydotts.nl";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appBase}/abonnement?checkout=success`,
      cancel_url: `${appBase}/abonnement?checkout=cancel`,
      metadata: { org_id: orgId },
      customer_email: org?.email ?? userData.user.email ?? undefined,
    });

    return json(req, { url: session.url });
  } catch (e) {
    console.error("create-checkout-session fatal", e);
    return json(req, { error: "internal_error" }, 500);
  }
});
