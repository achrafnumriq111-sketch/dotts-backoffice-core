import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, X, GripVertical, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/context/OrgContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { centsToInput, inputToCents } from "@/lib/eur";
import { useQueryClient } from "@tanstack/react-query";

interface VariantRow {
  id?: string; // undefined = new
  name: string;
  priceInput: string;
  sku: string;
  sort_order: number;
  active: boolean;
  _deleted?: boolean;
}

interface AttachedGroup {
  group_id: string;
  sort_order: number;
}

interface CategoryOpt {
  id: string;
  name: string;
}
interface TaxOpt {
  id: string;
  name: string;
  rate_bps: number;
  is_default: boolean;
}
interface ModifierGroup {
  id: string;
  name: string;
  active: boolean;
}

interface Props {
  open: boolean;
  productId: string | null; // null = create
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}

const GENERIC_ERR = "Er ging iets mis. Probeer het opnieuw.";

export function ProductEditor({ open, productId, onOpenChange, onSaved }: Props) {
  const { currentOrg } = useOrg();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("basis");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reference data
  const [categories, setCategories] = useState<CategoryOpt[]>([]);
  const [taxes, setTaxes] = useState<TaxOpt[]>([]);
  const [allGroups, setAllGroups] = useState<ModifierGroup[]>([]);
  const [groupSearch, setGroupSearch] = useState("");

  // Inline new-category mini-dialog
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSaving, setNewCatSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [taxRateId, setTaxRateId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("0,00");
  const [sku, setSku] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Variants
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [originalVariantIds, setOriginalVariantIds] = useState<Set<string>>(new Set());

  // Modifier group attachments
  const [attached, setAttached] = useState<AttachedGroup[]>([]);
  const [originalAttachedIds, setOriginalAttachedIds] = useState<Set<string>>(new Set());
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Reset + load when opening
  useEffect(() => {
    if (!open || !currentOrg) return;
    setTab("basis");
    setName("");
    setCategoryId(null);
    setTaxRateId(null);
    setPriceInput("0,00");
    setSku("");
    setIsActive(true);
    setVariants([]);
    setOriginalVariantIds(new Set());
    setAttached([]);
    setOriginalAttachedIds(new Set());
    setGroupSearch("");
    setLoading(true);

    (async () => {
      const orgId = currentOrg.id;
      const [catsRes, taxRes, groupsRes] = await Promise.all([
        supabase
          .from("product_categories")
          .select("id, name")
          .eq("org_id", orgId)
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),
        supabase
          .from("tax_rates")
          .select("id, name, rate_bps, is_default")
          .eq("org_id", orgId)
          .eq("is_active", true)
          .order("rate_bps"),
        supabase
          .from("modifier_groups")
          .select("id, name, active")
          .eq("org_id", orgId)
          .order("name"),
      ]);

      if (catsRes.error || taxRes.error || groupsRes.error) {
        console.error(catsRes.error || taxRes.error || groupsRes.error);
        toast.error(GENERIC_ERR);
        setLoading(false);
        return;
      }

      setCategories(catsRes.data ?? []);
      setTaxes(taxRes.data ?? []);
      setAllGroups(groupsRes.data ?? []);

      if (productId) {
        const [pRes, vRes, pmgRes] = await Promise.all([
          supabase
            .from("products")
            .select("name, sku, price_cents, is_active, category_id, tax_rate_id")
            .eq("id", productId)
            .maybeSingle(),
          supabase
            .from("product_variants")
            .select("id, name, sku, price_cents, sort_order, active")
            .eq("product_id", productId)
            .order("sort_order"),
          supabase
            .from("product_modifier_groups")
            .select("group_id, sort_order")
            .eq("product_id", productId)
            .order("sort_order"),
        ]);

        if (pRes.error || vRes.error || pmgRes.error || !pRes.data) {
          console.error(pRes.error || vRes.error || pmgRes.error);
          toast.error(GENERIC_ERR);
          setLoading(false);
          return;
        }

        setName(pRes.data.name ?? "");
        setSku(pRes.data.sku ?? "");
        setCategoryId(pRes.data.category_id);
        setTaxRateId(pRes.data.tax_rate_id);
        setPriceInput(centsToInput(pRes.data.price_cents));
        setIsActive(pRes.data.is_active);

        const vRows: VariantRow[] = (vRes.data ?? []).map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku ?? "",
          priceInput: centsToInput(v.price_cents),
          sort_order: v.sort_order,
          active: v.active,
        }));
        setVariants(vRows);
        setOriginalVariantIds(new Set(vRows.map((v) => v.id!).filter(Boolean)));

        const attachments: AttachedGroup[] = (pmgRes.data ?? []).map((p) => ({
          group_id: p.group_id,
          sort_order: p.sort_order,
        }));
        setAttached(attachments);
        setOriginalAttachedIds(new Set(attachments.map((a) => a.group_id)));
      } else {
        // default tax rate
        const defaultTax = (taxRes.data ?? []).find((t) => t.is_default);
        if (defaultTax) setTaxRateId(defaultTax.id);
      }
      setLoading(false);
    })();
  }, [open, productId, currentOrg]);

  const filteredGroups = useMemo(() => {
    const q = groupSearch.trim().toLowerCase();
    const attachedSet = new Set(attached.map((a) => a.group_id));
    return allGroups
      .filter((g) => !attachedSet.has(g.id))
      .filter((g) => (q ? g.name.toLowerCase().includes(q) : true));
  }, [allGroups, attached, groupSearch]);

  const groupsById = useMemo(() => {
    const m = new Map<string, ModifierGroup>();
    allGroups.forEach((g) => m.set(g.id, g));
    return m;
  }, [allGroups]);

  const addVariant = () =>
    setVariants((prev) => [
      ...prev,
      {
        name: "",
        priceInput: "0,00",
        sku: "",
        sort_order: prev.length,
        active: true,
      },
    ]);

  const updateVariant = (idx: number, patch: Partial<VariantRow>) =>
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)));

  const removeVariant = (idx: number) =>
    setVariants((prev) => {
      const row = prev[idx];
      if (row.id) {
        return prev.map((v, i) => (i === idx ? { ...v, _deleted: true } : v));
      }
      return prev.filter((_, i) => i !== idx);
    });

  const attachGroup = (groupId: string) => {
    setAttached((prev) => [...prev, { group_id: groupId, sort_order: prev.length }]);
  };

  const detachGroup = (groupId: string) => {
    setAttached((prev) =>
      prev
        .filter((a) => a.group_id !== groupId)
        .map((a, i) => ({ ...a, sort_order: i })),
    );
  };

  const onDragStart = (i: number) => setDragIndex(i);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (i: number) => {
    if (dragIndex === null || dragIndex === i) return;
    setAttached((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(i, 0, moved);
      return next.map((a, idx) => ({ ...a, sort_order: idx }));
    });
    setDragIndex(null);
  };

  const handleSave = async () => {
    if (!currentOrg) return;
    if (!name.trim() || name.length > 120) {
      toast.error("Vul een geldige naam in (max 120 tekens).");
      setTab("basis");
      return;
    }
    if (!taxRateId) {
      toast.error("Kies een BTW-tarief.");
      setTab("basis");
      return;
    }
    const priceCents = inputToCents(priceInput);
    if (priceCents < 0) {
      toast.error("Basisprijs is ongeldig.");
      setTab("basis");
      return;
    }
    if (sku && sku.length > 40) {
      toast.error("SKU mag maximaal 40 tekens zijn.");
      setTab("basis");
      return;
    }

    setSaving(true);
    try {
      const orgId = currentOrg.id;
      let pid = productId;

      if (pid) {
        const { error } = await supabase
          .from("products")
          .update({
            name: name.trim(),
            category_id: categoryId,
            tax_rate_id: taxRateId,
            price_cents: priceCents,
            sku: sku.trim() || null,
            is_active: isActive,
          })
          .eq("id", pid);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert({
            org_id: orgId,
            name: name.trim(),
            category_id: categoryId,
            tax_rate_id: taxRateId,
            price_cents: priceCents,
            sku: sku.trim() || null,
            is_active: isActive,
          })
          .select("id")
          .single();
        if (error || !data) throw error ?? new Error("insert failed");
        pid = data.id;
      }

      // ---- Variants diff ----
      const currentIds = new Set(variants.filter((v) => v.id && !v._deleted).map((v) => v.id!));
      const toDelete = [...originalVariantIds].filter((id) => !currentIds.has(id));
      if (toDelete.length > 0) {
        const { error } = await supabase
          .from("product_variants")
          .delete()
          .in("id", toDelete);
        if (error) throw error;
      }

      const inserts = variants.filter((v) => !v.id && !v._deleted && v.name.trim());
      if (inserts.length > 0) {
        const { error } = await supabase.from("product_variants").insert(
          inserts.map((v) => ({
            org_id: orgId,
            product_id: pid!,
            name: v.name.trim(),
            sku: v.sku.trim() || null,
            price_cents: inputToCents(v.priceInput),
            sort_order: v.sort_order,
            active: v.active,
          })),
        );
        if (error) throw error;
      }

      const updates = variants.filter((v) => v.id && !v._deleted);
      for (const v of updates) {
        const { error } = await supabase
          .from("product_variants")
          .update({
            name: v.name.trim(),
            sku: v.sku.trim() || null,
            price_cents: inputToCents(v.priceInput),
            sort_order: v.sort_order,
            active: v.active,
          })
          .eq("id", v.id!);
        if (error) throw error;
      }

      // ---- Modifier-group attachments diff ----
      const currentAttachedIds = new Set(attached.map((a) => a.group_id));
      const detached = [...originalAttachedIds].filter((id) => !currentAttachedIds.has(id));
      if (detached.length > 0) {
        const { error } = await supabase
          .from("product_modifier_groups")
          .delete()
          .eq("product_id", pid!)
          .in("group_id", detached);
        if (error) throw error;
      }

      // Single upsert for all attachments (no N+1).
      if (attached.length > 0) {
        const { error } = await supabase
          .from("product_modifier_groups")
          .upsert(
            attached.map((a) => ({
              org_id: orgId,
              product_id: pid!,
              group_id: a.group_id,
              sort_order: a.sort_order,
            })),
            { onConflict: "product_id,group_id" },
          );
        if (error) throw error;
      }

      toast.success("Product opgeslagen.");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      console.error(e);
      toast.error("Opslaan mislukt. Probeer opnieuw.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!currentOrg) return;
    const trimmed = newCatName.trim();
    if (!trimmed) {
      toast.error("Geef de categorie een naam.");
      return;
    }
    setNewCatSaving(true);
    try {
      const maxSort = categories.reduce(
        (m, c) => Math.max(m, (c as { sort_order?: number }).sort_order ?? 0),
        0,
      );
      const { data, error } = await supabase
        .from("product_categories")
        .insert({
          org_id: currentOrg.id,
          name: trimmed,
          sort_order: maxSort + 1,
          is_active: true,
        })
        .select("id, name")
        .single();
      if (error || !data) throw error ?? new Error("insert failed");
      const next = [...categories, { id: data.id, name: data.name }].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      setCategories(next);
      setCategoryId(data.id);
      queryClient.invalidateQueries({ queryKey: ["product_categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Categorie aangemaakt.");
      setNewCatOpen(false);
      setNewCatName("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : GENERIC_ERR;
      console.error(e);
      toast.error(msg);
    } finally {
      setNewCatSaving(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 sm:max-w-3xl gap-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{productId ? "Product bewerken" : "Nieuw product"}</DialogTitle>
          <DialogDescription>
            Beheer basisgegevens, varianten en modifier-groepen.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-2/3" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="flex flex-col">
            <div className="border-b px-6 pt-3">
              <TabsList>
                <TabsTrigger value="basis">Basis</TabsTrigger>
                <TabsTrigger value="varianten">
                  Varianten
                  {variants.filter((v) => !v._deleted).length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5">
                      {variants.filter((v) => !v._deleted).length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="modifiers">
                  Modifier-groepen
                  {attached.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5">
                      {attached.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              <TabsContent value="basis" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="p-name">Naam</Label>
                  <Input
                    id="p-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={120}
                    placeholder="Cappuccino"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Categorie</Label>
                    <Select
                      value={categoryId ?? "__none__"}
                      onValueChange={(v) => setCategoryId(v === "__none__" ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Geen categorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Geen categorie</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                        <div className="my-1 border-t" />
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setNewCatName("");
                            setNewCatOpen(true);
                          }}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent"
                        >
                          <Plus className="h-3.5 w-3.5" /> Nieuwe categorie aanmaken
                        </button>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>BTW-tarief</Label>
                    <Select value={taxRateId ?? ""} onValueChange={setTaxRateId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kies BTW" />
                      </SelectTrigger>
                      <SelectContent>
                        {taxes.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} ({(t.rate_bps / 100).toFixed(0)}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="p-price">Basisprijs (€)</Label>
                    <Input
                      id="p-price"
                      inputMode="decimal"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      placeholder="3,50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Gebruikt als het product geen varianten heeft.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p-sku">SKU</Label>
                    <Input
                      id="p-sku"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      maxLength={40}
                      placeholder="Optioneel"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <Label className="text-sm">Actief</Label>
                    <p className="text-xs text-muted-foreground">
                      Inactieve producten verschijnen niet in de kassa.
                    </p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </TabsContent>

              <TabsContent value="varianten" className="mt-0 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Laat leeg als dit product geen varianten heeft. De basisprijs wordt dan
                  gebruikt.
                </p>
                <div className="space-y-2">
                  {variants.filter((v) => !v._deleted).length === 0 && (
                    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Nog geen varianten.
                    </div>
                  )}
                  {variants.map((v, idx) =>
                    v._deleted ? null : (
                      <div
                        key={v.id ?? `new-${idx}`}
                        className="grid grid-cols-12 gap-2 rounded-md border p-2"
                      >
                        <Input
                          className="col-span-4"
                          placeholder="Naam"
                          value={v.name}
                          onChange={(e) => updateVariant(idx, { name: e.target.value })}
                        />
                        <Input
                          className="col-span-2"
                          inputMode="decimal"
                          placeholder="Prijs"
                          value={v.priceInput}
                          onChange={(e) => updateVariant(idx, { priceInput: e.target.value })}
                        />
                        <Input
                          className="col-span-3"
                          placeholder="SKU"
                          value={v.sku}
                          onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                          maxLength={40}
                        />
                        <Input
                          className="col-span-1"
                          type="number"
                          value={v.sort_order}
                          onChange={(e) =>
                            updateVariant(idx, { sort_order: Number(e.target.value) || 0 })
                          }
                        />
                        <div className="col-span-1 flex items-center justify-center">
                          <Switch
                            checked={v.active}
                            onCheckedChange={(c) => updateVariant(idx, { active: c })}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="col-span-1 h-9 w-9"
                          onClick={() => removeVariant(idx)}
                          aria-label="Verwijderen"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ),
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={addVariant} className="gap-2">
                  <Plus className="h-4 w-4" /> Variant toevoegen
                </Button>
              </TabsContent>

              <TabsContent value="modifiers" className="mt-0 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Beschikbare groepen</Label>
                    <Input
                      placeholder="Zoek groep…"
                      value={groupSearch}
                      onChange={(e) => setGroupSearch(e.target.value)}
                    />
                    <div className="max-h-72 overflow-y-auto rounded-md border">
                      {filteredGroups.length === 0 ? (
                        <p className="p-4 text-center text-xs text-muted-foreground">
                          Geen groepen gevonden.
                        </p>
                      ) : (
                        filteredGroups.map((g) => (
                          <button
                            key={g.id}
                            onClick={() => attachGroup(g.id)}
                            className="flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent"
                          >
                            <span>{g.name}</span>
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Gekoppeld aan dit product</Label>
                    <div className="max-h-72 overflow-y-auto rounded-md border">
                      {attached.length === 0 ? (
                        <p className="p-4 text-center text-xs text-muted-foreground">
                          Nog geen groepen gekoppeld.
                        </p>
                      ) : (
                        attached.map((a, i) => {
                          const g = groupsById.get(a.group_id);
                          return (
                            <div
                              key={a.group_id}
                              draggable
                              onDragStart={() => onDragStart(i)}
                              onDragOver={onDragOver}
                              onDrop={() => onDrop(i)}
                              className="flex items-center justify-between border-b px-3 py-2 text-sm last:border-b-0"
                            >
                              <div className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                                <span>{g?.name ?? "—"}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => detachGroup(a.group_id)}
                                aria-label="Loskoppelen"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                  Geselecteerde groepen worden getoond in de kassa in volgorde hierboven.
                </div>

                <a
                  href="/producten/modifier-groepen"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Nieuwe modifier-groep aanmaken
                  <ExternalLink className="h-3 w-3" />
                </a>
              </TabsContent>
            </div>

            <div className="flex items-center justify-end gap-2 border-t bg-card px-6 py-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Annuleren
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Opslaan…" : "Opslaan"}
              </Button>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>

    <Dialog open={newCatOpen} onOpenChange={setNewCatOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nieuwe categorie</DialogTitle>
          <DialogDescription>Voeg snel een categorie toe.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="new-cat-name">Naam</Label>
          <Input
            id="new-cat-name"
            autoFocus
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !newCatSaving) {
                e.preventDefault();
                void handleCreateCategory();
              }
            }}
            placeholder="Bijv. Koffie"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setNewCatOpen(false)}
            disabled={newCatSaving}
          >
            Annuleren
          </Button>
          <Button onClick={handleCreateCategory} disabled={newCatSaving}>
            {newCatSaving ? "Opslaan…" : "Opslaan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
