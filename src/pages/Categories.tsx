import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Save, FolderTree } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/context/OrgContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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

interface CategoryRow {
  id: string;
  name: string;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  product_count: number;
}

const GENERIC_ERR = "Er ging iets mis. Probeer het opnieuw.";

export default function Categories() {
  const { currentOrg } = useOrg();
  const queryClient = useQueryClient();

  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteHasProducts, setDeleteHasProducts] = useState(0);

  const fetchRows = useCallback(async () => {
    if (!currentOrg) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("product_categories")
      .select("id, name, color, sort_order, is_active, products(count)")
      .eq("org_id", currentOrg.id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) {
      console.error(error);
      toast.error(GENERIC_ERR);
      setLoading(false);
      return;
    }
    const mapped: CategoryRow[] = (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      sort_order: c.sort_order,
      is_active: c.is_active,
      product_count: Array.isArray(c.products)
        ? (c.products[0]?.count as number | undefined) ?? 0
        : 0,
    }));
    setRows(mapped);
    setLoading(false);
  }, [currentOrg]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  // Load form when selecting a row
  useEffect(() => {
    if (creating) {
      const max = rows.reduce((m, r) => Math.max(m, r.sort_order), -1);
      setName("");
      setColor("");
      setSortOrder(max + 1);
      setIsActive(true);
      return;
    }
    if (!selectedId) {
      setName("");
      setColor("");
      setSortOrder(0);
      setIsActive(true);
      return;
    }
    const r = rows.find((x) => x.id === selectedId);
    if (!r) return;
    setName(r.name);
    setColor(r.color ?? "");
    setSortOrder(r.sort_order);
    setIsActive(r.is_active);
  }, [selectedId, rows, creating]);

  const startCreate = () => {
    setSelectedId(null);
    setCreating(true);
  };

  const selectRow = (id: string) => {
    setCreating(false);
    setSelectedId(id);
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["product_categories"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const handleSave = async () => {
    if (!currentOrg) return;
    if (!name.trim()) {
      toast.error("Geef de categorie een naam.");
      return;
    }
    setSaving(true);
    try {
      if (creating) {
        const { data, error } = await supabase
          .from("product_categories")
          .insert({
            org_id: currentOrg.id,
            name: name.trim(),
            color: color.trim() || null,
            sort_order: sortOrder,
            is_active: isActive,
          })
          .select("id")
          .single();
        if (error) throw error;
        toast.success("Categorie aangemaakt.");
        await fetchRows();
        invalidate();
        setCreating(false);
        setSelectedId(data!.id);
      } else if (selectedId) {
        const { error } = await supabase
          .from("product_categories")
          .update({
            name: name.trim(),
            color: color.trim() || null,
            sort_order: sortOrder,
            is_active: isActive,
          })
          .eq("id", selectedId);
        if (error) throw error;
        toast.success("Categorie opgeslagen.");
        await fetchRows();
        invalidate();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : GENERIC_ERR;
      console.error(e);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const openDelete = async () => {
    if (!selectedId || !currentOrg) return;
    const { count, error } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("org_id", currentOrg.id)
      .eq("category_id", selectedId);
    if (error) {
      toast.error(GENERIC_ERR);
      return;
    }
    setDeleteHasProducts(count ?? 0);
    setDeleteOpen(true);
  };

  const findDefaultCategoryId = async (): Promise<string | null> => {
    if (!currentOrg) return null;
    const { data, error } = await supabase
      .from("product_categories")
      .select("id, name")
      .eq("org_id", currentOrg.id)
      .eq("is_active", true)
      .order("sort_order")
      .order("name");
    if (error || !data) return null;
    const algemeen = data.find(
      (c) => c.name.toLowerCase() === "algemeen" && c.id !== selectedId,
    );
    if (algemeen) return algemeen.id;
    const other = data.find((c) => c.id !== selectedId);
    return other?.id ?? null;
  };

  const handleDelete = async (moveFirst: boolean) => {
    if (!selectedId) return;
    setSaving(true);
    try {
      if (moveFirst) {
        const targetId = await findDefaultCategoryId();
        const { error: upErr } = await supabase
          .from("products")
          .update({ category_id: targetId })
          .eq("category_id", selectedId);
        if (upErr) throw upErr;
      }
      const { error } = await supabase
        .from("product_categories")
        .delete()
        .eq("id", selectedId);
      if (error) throw error;
      toast.success("Categorie verwijderd.");
      setDeleteOpen(false);
      setSelectedId(null);
      await fetchRows();
      invalidate();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : GENERIC_ERR;
      console.error(e);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const inEditOrCreate = creating || !!selectedId;

  return (
    <>
      <PageHeader
        title="Categorieën"
        subtitle="Beheer productcategorieën die in de kassa als tabs verschijnen."
        action={
          <Button onClick={startCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Nieuwe categorie
          </Button>
        }
      />

      {!loading && rows.length === 0 && !creating ? (
        <Card className="flex flex-col items-center gap-4 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <FolderTree className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Nog geen categorieën</p>
            <p className="text-sm text-muted-foreground">
              Maak een categorie om je producten te groeperen.
            </p>
          </div>
          <Button onClick={startCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Nieuwe categorie
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-[minmax(220px,30%)_1fr]">
          <Card className="p-2">
            {loading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : (
              <ul className="space-y-1">
                {rows.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => selectRow(c.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                        !creating && selectedId === c.id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {c.color && (
                          <span
                            className="h-3 w-3 shrink-0 rounded-full border"
                            style={{ backgroundColor: c.color }}
                          />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{c.name}</span>
                            {!c.is_active && (
                              <span className="text-[10px] uppercase text-muted-foreground">
                                inactief
                              </span>
                            )}
                          </div>
                          <Badge variant="secondary" className="mt-0.5 h-4 text-[10px] font-normal">
                            {c.product_count}{" "}
                            {c.product_count === 1 ? "product" : "producten"}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            {!inEditOrCreate ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center text-sm text-muted-foreground">
                <p>Selecteer een categorie om te bewerken, of</p>
                <Button onClick={startCreate} variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Nieuwe categorie
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="font-normal">
                    {creating ? "Nieuwe categorie" : "Categorie"}
                  </Badge>
                  <div className="flex gap-2">
                    {!creating && selectedId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openDelete}
                        disabled={saving}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Verwijderen
                      </Button>
                    )}
                    <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
                      <Save className="h-4 w-4" />
                      {saving ? "Opslaan…" : "Opslaan"}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="c-name">Naam</Label>
                    <Input
                      id="c-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Bijv. Koffie, Lunch"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="c-color">Kleur</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="c-color"
                        type="color"
                        value={color || "#64748b"}
                        onChange={(e) => setColor(e.target.value)}
                        className="h-10 w-16 cursor-pointer p-1"
                      />
                      <Input
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="#64748B (optioneel)"
                        className="flex-1"
                      />
                      {color && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setColor("")}
                          className="text-xs"
                        >
                          Wissen
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="c-sort">Sorteervolgorde</Label>
                    <Input
                      id="c-sort"
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Lager getal verschijnt eerst in de kassa.
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-md border p-3 sm:col-span-2">
                    <div>
                      <Label htmlFor="c-act" className="cursor-pointer text-sm">
                        Actief
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Inactieve categorieën verschijnen niet als tab in de kassa.
                      </p>
                    </div>
                    <Switch id="c-act" checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Categorie verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteHasProducts > 0
                ? `Deze categorie heeft ${deleteHasProducts} gekoppeld${deleteHasProducts === 1 ? " product" : "e producten"}. Wat wil je doen?`
                : "Weet je zeker dat je deze categorie wilt verwijderen? Dit kan niet ongedaan worden gemaakt."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Annuleren</AlertDialogCancel>
            {deleteHasProducts > 0 ? (
              <AlertDialogAction
                disabled={saving}
                onClick={(e) => {
                  e.preventDefault();
                  void handleDelete(true);
                }}
              >
                Verplaats naar Algemeen + verwijder
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                disabled={saving}
                onClick={(e) => {
                  e.preventDefault();
                  void handleDelete(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Verwijderen
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}