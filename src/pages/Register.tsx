import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/context/OrgContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn } from "@/lib/utils";
import { formatEUR } from "@/lib/i18n";
import {
  CartLine,
  CatalogCategory,
  CatalogModifierGroup,
  CatalogProduct,
  CatalogVariant,
  SaleSuccess,
  modifiersHash,
} from "./register/types";
import { VariantPicker } from "./register/VariantPicker";
import { ModifierPicker, PickedModifier } from "./register/ModifierPicker";
import { PaymentModal } from "./register/PaymentModal";
import { ReceiptModal } from "./register/ReceiptModal";

const GENERIC_ERR = "Er ging iets mis bij het laden";

type RpcError = { code?: string; message?: string };

function aggregateTax(cart: CartLine[]): {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  byRate: { rateBps: number; vatCents: number; exVatCents: number }[];
} {
  let subtotalCents = 0;
  let taxCents = 0;
  const map = new Map<number, { vat: number; ex: number }>();
  for (const i of cart) {
    const lineIncl = i.unitPriceCents * i.quantity;
    const lineEx = Math.round((lineIncl * 10000) / (10000 + i.taxRateBps));
    const lineVat = lineIncl - lineEx;
    subtotalCents += lineEx;
    taxCents += lineVat;
    const cur = map.get(i.taxRateBps) ?? { vat: 0, ex: 0 };
    cur.vat += lineVat;
    cur.ex += lineEx;
    map.set(i.taxRateBps, cur);
  }
  const byRate = Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([rateBps, v]) => ({ rateBps, vatCents: v.vat, exVatCents: v.ex }));
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents, byRate };
}

export default function Register() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id ?? null;
  const orgName = currentOrg?.name ?? null;

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [defaultLocationId, setDefaultLocationId] = useState<string | null>(null);

  const [activeCat, setActiveCat] = useState<string>("__all__");
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Cart
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pulseId, setPulseId] = useState<string | null>(null);

  // Pickers
  const [variantOpen, setVariantOpen] = useState(false);
  const [modifierOpen, setModifierOpen] = useState(false);
  const [pickerProduct, setPickerProduct] = useState<CatalogProduct | null>(null);
  const [pickedVariant, setPickedVariant] = useState<CatalogVariant | null>(null);

  // Payment + receipt
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lockedReadOnly, setLockedReadOnly] = useState(false);
  const [receipt, setReceipt] = useState<SaleSuccess | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const [confirmClear, setConfirmClear] = useState(false);

  // Mobile drawer
  const [cartExpanded, setCartExpanded] = useState(false);

  // Load catalog
  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [prodRes, varRes, catRes, mgRes, pmgRes, locRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, price_cents, category_id, tax_rate_id, is_active, tax_rates(rate_bps)")
          .eq("org_id", orgId)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("product_variants")
          .select("id, product_id, name, price_cents, sort_order, active")
          .eq("org_id", orgId)
          .eq("active", true)
          .order("sort_order")
          .order("name"),
        supabase
          .from("product_categories")
          .select("id, name")
          .eq("org_id", orgId)
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),
        supabase
          .from("modifier_groups")
          .select("id, name, min_select, max_select, required, modifiers(id, name, price_delta_cents, sort_order, active)")
          .eq("org_id", orgId)
          .eq("active", true),
        supabase
          .from("product_modifier_groups")
          .select("product_id, group_id, sort_order")
          .eq("org_id", orgId)
          .order("sort_order"),
        supabase
          .from("locations")
          .select("id, is_primary, created_at")
          .eq("org_id", orgId)
          .eq("is_active", true)
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: true })
          .limit(1),
      ]);

      if (cancelled) return;

      const errs = [prodRes.error, varRes.error, catRes.error, mgRes.error, pmgRes.error, locRes.error].filter(Boolean);
      if (errs.length > 0) {
        console.error("kassa load failed", errs);
        toast.error(GENERIC_ERR);
        setLoading(false);
        return;
      }

      const variantsByProduct = new Map<string, CatalogVariant[]>();
      for (const v of varRes.data ?? []) {
        const arr = variantsByProduct.get(v.product_id) ?? [];
        arr.push({
          id: v.id,
          product_id: v.product_id,
          name: v.name,
          price_cents: v.price_cents,
          sort_order: v.sort_order ?? 0,
        });
        variantsByProduct.set(v.product_id, arr);
      }

      const groupsById = new Map<string, CatalogModifierGroup>();
      for (const g of mgRes.data ?? []) {
        const mods = ((g.modifiers ?? []) as { id: string; name: string; price_delta_cents: number; sort_order: number; active: boolean }[])
          .filter((m) => m.active !== false)
          .map((m) => ({
            id: m.id,
            name: m.name,
            price_delta_cents: m.price_delta_cents ?? 0,
            sort_order: m.sort_order ?? 0,
          }));
        groupsById.set(g.id, {
          id: g.id,
          name: g.name,
          min_select: g.min_select ?? 0,
          max_select: g.max_select ?? 1,
          required: !!g.required,
          modifiers: mods,
        });
      }

      const groupsByProduct = new Map<string, CatalogModifierGroup[]>();
      const sortedPmg = [...(pmgRes.data ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      for (const link of sortedPmg) {
        const grp = groupsById.get(link.group_id);
        if (!grp) continue;
        const arr = groupsByProduct.get(link.product_id) ?? [];
        arr.push(grp);
        groupsByProduct.set(link.product_id, arr);
      }

      const cat: CatalogProduct[] = (prodRes.data ?? []).map((p) => {
        const tax = (p.tax_rates as { rate_bps: number } | null) ?? null;
        return {
          id: p.id,
          name: p.name,
          price_cents: p.price_cents,
          category_id: p.category_id,
          tax_rate_bps: tax?.rate_bps ?? 0,
          variants: variantsByProduct.get(p.id) ?? [],
          groups: groupsByProduct.get(p.id) ?? [],
        };
      });

      setProducts(cat);
      setCategories((catRes.data ?? []).map((c) => ({ id: c.id, name: c.name })));
      setDefaultLocationId(locRes.data?.[0]?.id ?? null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [orgId]);

  // Filtered products
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCat !== "__all__" && p.category_id !== activeCat) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, activeCat]);

  const totals = useMemo(() => aggregateTax(cart), [cart]);

  // Cart helpers
  const addLine = useCallback(
    (line: CartLine) => {
      setCart((prev) => {
        const hash = modifiersHash(line);
        const idx = prev.findIndex(
          (l) => l.productId === line.productId && modifiersHash(l) === hash,
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + line.quantity };
          return next;
        }
        return [...prev, line];
      });
      setPulseId(line.productId);
      window.setTimeout(() => setPulseId((id) => (id === line.productId ? null : id)), 280);
    },
    [],
  );

  const buildLine = (
    product: CatalogProduct,
    variant: CatalogVariant | null,
    modifiers: PickedModifier[],
  ): CartLine => {
    const base = variant?.price_cents ?? product.price_cents;
    const delta = modifiers.reduce((s, m) => s + m.price_delta_cents, 0);
    return {
      clientId: crypto.randomUUID(),
      productId: product.id,
      productName: product.name,
      variantId: variant?.id ?? null,
      variantName: variant?.name ?? null,
      modifiers: modifiers.map((m) => ({ name: m.name, price_cents: m.price_delta_cents })),
      unitPriceCents: base + delta,
      quantity: 1,
      taxRateBps: product.tax_rate_bps,
    };
  };

  const onTapProduct = (product: CatalogProduct) => {
    const hasVariants = product.variants.length > 0;
    const hasGroups = product.groups.length > 0;
    if (!hasVariants && !hasGroups) {
      addLine(buildLine(product, null, []));
      return;
    }
    setPickerProduct(product);
    setPickedVariant(null);
    if (hasVariants) {
      setVariantOpen(true);
    } else {
      setModifierOpen(true);
    }
  };

  const onVariantPicked = (variant: CatalogVariant) => {
    setVariantOpen(false);
    if (!pickerProduct) return;
    if (pickerProduct.groups.length > 0) {
      setPickedVariant(variant);
      setModifierOpen(true);
    } else {
      addLine(buildLine(pickerProduct, variant, []));
      setPickerProduct(null);
    }
  };

  const onModifiersDone = (picked: PickedModifier[]) => {
    if (!pickerProduct) return;
    addLine(buildLine(pickerProduct, pickedVariant, picked));
    setModifierOpen(false);
    setPickerProduct(null);
    setPickedVariant(null);
  };

  const cancelPickers = () => {
    setVariantOpen(false);
    setModifierOpen(false);
    setPickerProduct(null);
    setPickedVariant(null);
  };

  const incQty = (clientId: string) =>
    setCart((prev) => prev.map((l) => (l.clientId === clientId ? { ...l, quantity: l.quantity + 1 } : l)));
  const decQty = (clientId: string) =>
    setCart((prev) =>
      prev.flatMap((l) =>
        l.clientId === clientId
          ? l.quantity <= 1
            ? []
            : [{ ...l, quantity: l.quantity - 1 }]
          : [l],
      ),
    );
  const removeLine = (clientId: string) => setCart((prev) => prev.filter((l) => l.clientId !== clientId));

  // Pay
  const onPay = async (args: { method: "cash" | "pin"; cashReceivedCents: number | null; changeCents: number | null }) => {
    if (!defaultLocationId || cart.length === 0) return;
    setSubmitting(true);
    const payload = {
      p_location_id: defaultLocationId,
      p_items: cart.map((i) => ({
        product_id: i.productId,
        variant_id: i.variantId,
        variant_name: i.variantName,
        unit_price_cents: i.unitPriceCents,
        quantity: i.quantity,
        tax_rate_bps: i.taxRateBps,
        modifiers: i.modifiers,
      })),
      p_subtotal_cents: totals.subtotalCents,
      p_tax_cents: totals.taxCents,
      p_discount_cents: 0,
      p_total_cents: totals.totalCents,
      p_payment_method: args.method,
      p_cash_received_cents: args.cashReceivedCents,
      p_change_cents: args.changeCents,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("create_sale", payload);
    setSubmitting(false);

    if (error) {
      const e = error as RpcError;
      console.error("create_sale failed", error);
      if (e.code === "55P03" || /read-only|alleen-lezen/i.test(e.message ?? "")) {
        toast.error("De organisatie staat in alleen-lezen modus. Betaal eerst je factuur.");
        setLockedReadOnly(true);
      } else if (e.code === "42501") {
        toast.error("Geen toegang.");
      } else if (e.code === "22023") {
        toast.error("Er klopt iets niet met de totalen. Ververs de pagina.");
      } else {
        toast.error("Betaling niet opgeslagen. Probeer het opnieuw.");
      }
      return;
    }

    const result = data as { sale_id: string; receipt_number: string };
    const success: SaleSuccess = {
      sale_id: result.sale_id,
      receipt_number: result.receipt_number,
      cashReceivedCents: args.cashReceivedCents,
      changeCents: args.changeCents,
      method: args.method,
      cart,
      subtotalCents: totals.subtotalCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      taxByRate: totals.byRate.map((r) => ({ rateBps: r.rateBps, vatCents: r.vatCents })),
      createdAt: new Date().toISOString(),
    };
    setReceipt(success);
    setPaymentOpen(false);
    setReceiptOpen(true);
    setCart([]);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "/" && !inField) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (
        e.key === "Enter" &&
        !inField &&
        cart.length > 0 &&
        !paymentOpen &&
        !receiptOpen &&
        !variantOpen &&
        !modifierOpen
      ) {
        e.preventDefault();
        setPaymentOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cart.length, paymentOpen, receiptOpen, variantOpen, modifierOpen]);

  const closeReceipt = () => {
    setReceiptOpen(false);
    setReceipt(null);
  };

  const newOrderFromReceipt = () => {
    closeReceipt();
    requestAnimationFrame(() => searchRef.current?.focus());
  };

  // ---------- UI ----------
  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-4rem)] sm:-mx-6 lg:-mx-8">
      {/* LEFT: Products */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-border lg:w-[60%]">
        {/* Search */}
        <div className="border-b border-border bg-card/50 px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder="Zoek product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="border-b border-border bg-card/50">
          <div className="flex gap-2 overflow-x-auto px-4 py-2">
            <CategoryPill label="Alles" active={activeCat === "__all__"} onClick={() => setActiveCat("__all__")} />
            {categories.map((c) => (
              <CategoryPill
                key={c.id}
                label={c.name}
                active={activeCat === c.id}
                onClick={() => setActiveCat(c.id)}
              />
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nog geen producten</p>
              <Link
                to="/producten"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Voeg je eerste product toe
              </Link>
            </div>
          ) : visible.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Geen producten gevonden.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visible.map((p) => (
                <ProductTile key={p.id} product={p} pulse={pulseId === p.id} onClick={() => onTapProduct(p)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart (desktop) */}
      <div className="hidden lg:flex lg:w-[40%] lg:flex-col">
        <CartPanel
          cart={cart}
          totals={totals}
          lockedReadOnly={lockedReadOnly}
          onClear={() => setConfirmClear(true)}
          onInc={incQty}
          onDec={decQty}
          onRemove={removeLine}
          onPay={() => setPaymentOpen(true)}
        />
      </div>

      {/* MOBILE: bottom drawer */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card shadow-lg lg:hidden">
        <button
          type="button"
          onClick={() => setCartExpanded((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              {cart.length === 0 ? "Bestelling leeg" : `${cart.reduce((s, l) => s + l.quantity, 0)} item(s)`}
            </span>
          </div>
          <span className="text-base font-semibold tabular-nums">{formatEUR(totals.totalCents)}</span>
        </button>
        {cartExpanded && (
          <div className="max-h-[70vh] overflow-hidden border-t border-border">
            <CartPanel
              cart={cart}
              totals={totals}
              lockedReadOnly={lockedReadOnly}
              onClear={() => setConfirmClear(true)}
              onInc={incQty}
              onDec={decQty}
              onRemove={removeLine}
              onPay={() => {
                setCartExpanded(false);
                setPaymentOpen(true);
              }}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <VariantPicker
        open={variantOpen}
        product={pickerProduct}
        hasModifiersNext={!!pickerProduct && pickerProduct.groups.length > 0}
        onCancel={cancelPickers}
        onPick={onVariantPicked}
      />
      <ModifierPicker
        open={modifierOpen}
        product={pickerProduct}
        groups={pickerProduct?.groups ?? []}
        onCancel={cancelPickers}
        onDone={onModifiersDone}
      />
      <PaymentModal
        open={paymentOpen}
        totalCents={totals.totalCents}
        submitting={submitting}
        onClose={() => !submitting && setPaymentOpen(false)}
        onPay={onPay}
      />
      <ReceiptModal
        open={receiptOpen}
        data={receipt}
        orgName={orgName}
        onClose={closeReceipt}
        onNewOrder={newOrderFromReceipt}
      />

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nieuwe bestelling?</AlertDialogTitle>
            <AlertDialogDescription>
              De huidige bestelling wordt geleegd. Weet je het zeker?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setCart([]);
                setConfirmClear(false);
              }}
            >
              Leegmaken
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------- Subcomponents ----------

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function ProductTile({
  product,
  pulse,
  onClick,
}: {
  product: CatalogProduct;
  pulse: boolean;
  onClick: () => void;
}) {
  const minVariantPrice =
    product.variants.length > 0
      ? Math.min(...product.variants.map((v) => v.price_cents))
      : null;
  const priceLabel =
    minVariantPrice !== null ? `vanaf ${formatEUR(minVariantPrice)}` : formatEUR(product.price_cents);
  const hasGroups = product.groups.length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex aspect-square min-h-[140px] flex-col items-start justify-between rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary hover:shadow-sm active:scale-[0.98]",
        pulse && "animate-pulse border-primary ring-2 ring-primary",
      )}
    >
      {hasGroups && (
        <span
          className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary"
          aria-label="Heeft opties"
        />
      )}
      <span className="line-clamp-2 text-sm font-semibold leading-tight">{product.name}</span>
      <span className="text-sm font-semibold text-primary">{priceLabel}</span>
    </button>
  );
}

function CartPanel({
  cart,
  totals,
  lockedReadOnly,
  onClear,
  onInc,
  onDec,
  onRemove,
  onPay,
}: {
  cart: CartLine[];
  totals: ReturnType<typeof aggregateTax>;
  lockedReadOnly: boolean;
  onClear: () => void;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
  onPay: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Bestelling</h2>
          <p className="text-xs text-muted-foreground">
            {cart.length === 0 ? "Geen items" : `${cart.length} regel(s)`}
          </p>
        </div>
        <Button variant="ghost" size="sm" disabled={cart.length === 0} onClick={onClear}>
          Nieuwe bestelling
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {cart.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4">
            <p className="text-center text-sm text-muted-foreground">
              Tik op een product om te beginnen.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {cart.map((line) => (
              <li key={line.clientId} className="rounded-md border border-border bg-background p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {line.productName}
                      {line.variantName ? <span className="text-muted-foreground"> · {line.variantName}</span> : null}
                    </p>
                    {line.modifiers.length > 0 && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {line.modifiers.map((m) => m.name).join(" · ")}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                      {formatEUR(line.unitPriceCents)} per stuk
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatEUR(line.unitPriceCents * line.quantity)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onDec(line.clientId)}
                      aria-label="Verminderen"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="min-w-[2ch] text-center text-sm font-medium tabular-nums">{line.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onInc(line.clientId)}
                      aria-label="Vermeerderen"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(line.clientId)}
                    aria-label="Verwijderen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-1 border-t border-border bg-card px-4 py-3 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotaal (excl. BTW)</span>
          <span className="tabular-nums">{formatEUR(totals.subtotalCents)}</span>
        </div>
        {totals.byRate.map((r) => (
          <div key={r.rateBps} className="flex justify-between text-muted-foreground">
            <span>BTW {(r.rateBps / 100).toFixed(0)}%</span>
            <span className="tabular-nums">{formatEUR(r.vatCents)}</span>
          </div>
        ))}
        <div className="flex justify-between pt-1 text-base font-semibold">
          <span>Totaal</span>
          <span className="tabular-nums">{formatEUR(totals.totalCents)}</span>
        </div>
        <Button
          size="lg"
          className="mt-3 h-14 w-full text-base"
          disabled={cart.length === 0 || lockedReadOnly}
          onClick={onPay}
        >
          Afrekenen · {formatEUR(totals.totalCents)}
        </Button>
      </div>
    </div>
  );
}