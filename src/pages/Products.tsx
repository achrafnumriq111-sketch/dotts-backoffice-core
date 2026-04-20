import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Settings2,
  Search,
  MoreHorizontal,
  Pencil,
  Copy,
  Archive,
  ArchiveRestore,
  PackageOpen,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/context/OrgContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductEditor } from "@/components/products/ProductEditor";
import { formatPriceCents } from "@/lib/eur";

interface Row {
  id: string;
  name: string;
  sku: string | null;
  price_cents: number;
  is_active: boolean;
  category_id: string | null;
  tax_rate_id: string | null;
  category_name: string | null;
  tax_name: string | null;
  tax_rate_bps: number | null;
  variant_count: number;
  group_count: number;
}

interface CategoryOpt {
  id: string;
  name: string;
}

const GENERIC_ERR = "Er ging iets mis. Probeer het opnieuw.";

export default function Products() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [categories, setCategories] = useState<CategoryOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [includeInactive, setIncludeInactive] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!currentOrg) return;
    setLoading(true);
    const orgId = currentOrg.id;
    const [productsRes, catsRes] = await Promise.all([
      supabase
        .from("products")
        .select(
          `id, name, sku, price_cents, is_active, category_id, tax_rate_id,
           product_categories(name),
           tax_rates(name, rate_bps),
           product_variants(count),
           product_modifier_groups(count)`,
        )
        .eq("org_id", orgId)
        .order("name"),
      supabase
        .from("product_categories")
        .select("id, name")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("name"),
    ]);

    if (productsRes.error || catsRes.error) {
      console.error(productsRes.error || catsRes.error);
      toast.error(GENERIC_ERR);
      setLoading(false);
      return;
    }

    const mapped: Row[] = (productsRes.data ?? []).map((p) => {
      // Supabase returns count joins as [{ count: n }]
      const variantCount = Array.isArray(p.product_variants)
        ? (p.product_variants[0]?.count as number | undefined) ?? 0
        : 0;
      const groupCount = Array.isArray(p.product_modifier_groups)
        ? (p.product_modifier_groups[0]?.count as number | undefined) ?? 0
        : 0;
      const cat = p.product_categories as { name: string } | null;
      const tax = p.tax_rates as { name: string; rate_bps: number } | null;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        price_cents: p.price_cents,
        is_active: p.is_active,
        category_id: p.category_id,
        tax_rate_id: p.tax_rate_id,
        category_name: cat?.name ?? null,
        tax_name: tax?.name ?? null,
        tax_rate_bps: tax?.rate_bps ?? null,
        variant_count: variantCount,
        group_count: groupCount,
      };
    });

    setRows(mapped);
    setCategories(catsRes.data ?? []);
    setLoading(false);
  }, [currentOrg]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (!includeInactive && !r.is_active) return false;
      if (categoryFilter !== "all" && r.category_id !== categoryFilter) return false;
      if (q) {
        const hay = `${r.name} ${r.sku ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, categoryFilter, includeInactive]);

  const openCreate = () => {
    setEditingId(null);
    setEditorOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setEditorOpen(true);
  };

  const toggleArchive = async (row: Row) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (error) {
      toast.error(GENERIC_ERR);
      return;
    }
    toast.success(row.is_active ? "Product gearchiveerd." : "Product geactiveerd.");
    void fetchData();
  };

  const duplicate = async (row: Row) => {
    if (!currentOrg) return;
    const { data, error } = await supabase
      .from("products")
      .insert({
        org_id: currentOrg.id,
        name: `${row.name} (kopie)`,
        sku: null,
        price_cents: row.price_cents,
        is_active: false,
        category_id: row.category_id,
        tax_rate_id: row.tax_rate_id,
      })
      .select("id")
      .single();
    if (error || !data) {
      toast.error(GENERIC_ERR);
      return;
    }
    toast.success("Product gedupliceerd.");
    await fetchData();
    openEdit(data.id);
  };

  return (
    <>
      <PageHeader
        title="Producten"
        subtitle="Beheer je artikelen, varianten en modifiers."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/producten/modifier-groepen")}
              className="gap-2"
            >
              <Settings2 className="h-4 w-4" />
              Modifier-groepen beheren
            </Button>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nieuw product
            </Button>
          </div>
        }
      />

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek op naam of SKU…"
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle categorieën</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch
              id="include-inactive"
              checked={includeInactive}
              onCheckedChange={setIncludeInactive}
            />
            <Label htmlFor="include-inactive" className="cursor-pointer text-sm">
              {includeInactive ? "Inclusief inactieve" : "Alleen actieve"}
            </Label>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>Categorie</TableHead>
              <TableHead className="text-right">BTW</TableHead>
              <TableHead className="text-right">Basisprijs</TableHead>
              <TableHead className="text-right">Varianten</TableHead>
              <TableHead className="text-right">Modifier-groepen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12 text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <PackageOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {rows.length === 0
                          ? "Nog geen producten"
                          : "Geen producten gevonden"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {rows.length === 0
                          ? "Voeg je eerste product toe om te beginnen."
                          : "Pas je filters aan om meer te zien."}
                      </p>
                    </div>
                    {rows.length === 0 && (
                      <Button onClick={openCreate} className="gap-2">
                        <Plus className="h-4 w-4" /> Nieuw product
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <div>{r.name}</div>
                    {r.sku && (
                      <div className="text-xs text-muted-foreground">{r.sku}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.category_name ? (
                      <Badge variant="secondary" className="font-normal">
                        {r.category_name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.tax_rate_bps !== null ? `${r.tax_rate_bps / 100}%` : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPriceCents(r.price_cents)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.variant_count}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.group_count}</TableCell>
                  <TableCell>
                    <Badge
                      variant={r.is_active ? "default" : "secondary"}
                      className={
                        r.is_active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {r.is_active ? "Actief" : "Inactief"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(r.id)}>
                          <Pencil className="mr-2 h-4 w-4" /> Bewerken
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicate(r)}>
                          <Copy className="mr-2 h-4 w-4" /> Dupliceren
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleArchive(r)}>
                          {r.is_active ? (
                            <>
                              <Archive className="mr-2 h-4 w-4" /> Archiveren
                            </>
                          ) : (
                            <>
                              <ArchiveRestore className="mr-2 h-4 w-4" /> Activeren
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <ProductEditor
        open={editorOpen}
        productId={editingId}
        onOpenChange={setEditorOpen}
        onSaved={fetchData}
      />
    </>
  );
}
