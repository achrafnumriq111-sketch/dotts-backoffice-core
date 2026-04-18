import { useState } from "react";
import { Plus, Trash2, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { t, formatCurrency } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

const PRODUCTS: Product[] = [
  { id: "p1", name: "Cappuccino", price: 3.5, category: "Koffie" },
  { id: "p2", name: "Espresso", price: 2.8, category: "Koffie" },
  { id: "p3", name: "Latte Macchiato", price: 3.8, category: "Koffie" },
  { id: "p4", name: "Verse muntthee", price: 3.2, category: "Thee" },
  { id: "p5", name: "Tosti ham/kaas", price: 6.5, category: "Lunch" },
  { id: "p6", name: "Soep van de dag", price: 7.5, category: "Lunch" },
  { id: "p7", name: "Appeltaart", price: 4.5, category: "Gebak" },
  { id: "p8", name: "Brownie", price: 3.9, category: "Gebak" },
  { id: "p9", name: "Bier tap", price: 4.2, category: "Drank" },
  { id: "p10", name: "Cola", price: 2.9, category: "Drank" },
  { id: "p11", name: "Spa rood", price: 2.5, category: "Drank" },
  { id: "p12", name: "Glas wijn", price: 5.5, category: "Drank" },
];

const CATEGORIES = ["Alle", "Koffie", "Thee", "Lunch", "Gebak", "Drank"];

interface CartItem {
  product: Product;
  qty: number;
}

export default function Register() {
  const tr = t();
  const [activeCat, setActiveCat] = useState("Alle");
  const [cart, setCart] = useState<CartItem[]>([]);

  const visible = activeCat === "Alle" ? PRODUCTS : PRODUCTS.filter((p) => p.category === activeCat);

  const add = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === p.id);
      if (existing) return prev.map((c) => (c.product.id === p.id ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { product: p, qty: 1 }];
    });
  };

  const remove = (id: string) => setCart((prev) => prev.filter((c) => c.product.id !== id));

  const subtotal = cart.reduce((sum, c) => sum + c.product.price * c.qty, 0);
  const tax = subtotal * 0.09;
  const total = subtotal + tax;

  return (
    <>
      <PageHeader title={tr.register.title} subtitle={tr.register.subtitle} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Products */}
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={cn(
                  "rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors",
                  activeCat === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {visible.map((p) => (
              <button
                key={p.id}
                onClick={() => add(p)}
                className="group flex flex-col items-start rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-primary hover:shadow-sm"
              >
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {p.category}
                </span>
                <span className="mt-1 text-sm font-medium leading-tight">{p.name}</span>
                <span className="mt-2 text-base font-semibold text-primary">
                  {formatCurrency(p.price)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <Card className="flex h-fit flex-col lg:sticky lg:top-20">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold">{tr.register.currentOrder}</h2>
          </div>
          <div className="max-h-[420px] flex-1 overflow-auto p-4">
            {cart.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{tr.register.emptyCart}</p>
            ) : (
              <ul className="space-y-2">
                {cart.map((c) => (
                  <li
                    key={c.product.id}
                    className="flex items-center gap-3 rounded-md border border-border p-2"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-secondary text-xs font-medium">
                      {c.qty}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(c.product.price)} · {c.product.category}
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(c.product.price * c.qty)}
                    </span>
                    <button
                      onClick={() => remove(c.product.id)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={tr.common.delete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-1 border-t border-border p-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{tr.register.subtotal}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{tr.register.tax} (9%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between pt-1 text-base font-semibold">
              <span>{tr.register.total}</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <Button size="lg" className="mt-3 w-full gap-2" disabled={cart.length === 0}>
              <CreditCard className="h-4 w-4" />
              {tr.register.pay}
            </Button>
          </div>
        </Card>
      </div>

      <Button className="hidden">
        <Plus />
      </Button>
    </>
  );
}
