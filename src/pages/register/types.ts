export interface CatalogVariant {
  id: string;
  product_id: string;
  name: string;
  price_cents: number;
  sort_order: number;
}

export interface CatalogModifier {
  id: string;
  name: string;
  price_delta_cents: number;
  sort_order: number;
}

export interface CatalogModifierGroup {
  id: string;
  name: string;
  min_select: number;
  max_select: number;
  required: boolean;
  modifiers: CatalogModifier[];
}

export interface CatalogProduct {
  id: string;
  name: string;
  price_cents: number;
  category_id: string | null;
  tax_rate_bps: number;
  variants: CatalogVariant[];
  groups: CatalogModifierGroup[];
}

export interface CatalogCategory {
  id: string;
  name: string;
}

export interface CartLine {
  clientId: string;
  productId: string;
  productName: string;
  variantId: string | null;
  variantName: string | null;
  modifiers: { name: string; price_cents: number }[];
  unitPriceCents: number;
  quantity: number;
  taxRateBps: number;
}

export interface SaleSuccess {
  sale_id: string;
  receipt_number: string;
  cashReceivedCents: number | null;
  changeCents: number | null;
  method: "cash" | "pin";
  cart: CartLine[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  taxByRate: { rateBps: number; vatCents: number }[];
  createdAt: string;
}

export function modifiersHash(line: Pick<CartLine, "variantId" | "modifiers">): string {
  const m = [...line.modifiers].map((x) => `${x.name}:${x.price_cents}`).sort().join("|");
  return `${line.variantId ?? ""}::${m}`;
}