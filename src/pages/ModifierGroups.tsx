import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Layers, Save } from "lucide-react";
import { toast } from "sonner";
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
import { centsToInput, formatPriceDelta, inputToCents } from "@/lib/eur";
import { cn } from "@/lib/utils";

interface GroupRow {
  id: string;
  name: string;
  required: boolean;
  active: boolean;
  min_select: number;
  max_select: number;
  modifier_count: number;
}

interface ModifierRow {
  id?: string;
  name: string;
  priceInput: string;
  sort_order: number;
  active: boolean;
  _deleted?: boolean;
}

const GENERIC_ERR = "Er ging iets mis. Probeer het opnieuw.";

export default function ModifierGroups() {
  const { currentOrg } = useOrg();
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Editor state
  const [editorLoading, setEditorLoading] = useState(false);
  const [name, setName] = useState("");
  const [required, setRequired] = useState(false);
  const [active, setActive] = useState(true);
  const [minSelect, setMinSelect] = useState(0);
  const [maxSelect, setMaxSelect] = useState(1);
  const [modifiers, setModifiers] = useState<ModifierRow[]>([]);
  const [originalModIds, setOriginalModIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchGroups = useCallback(async () => {
    if (!currentOrg) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("modifier_groups")
      .select("id, name, required, active, min_select, max_select, modifiers(count)")
      .eq("org_id", currentOrg.id)
      .order("name");
    if (error) {
      console.error(error);
      toast.error(GENERIC_ERR);
      setLoading(false);
      return;
    }
    const mapped: GroupRow[] = (data ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      required: g.required,
      active: g.active,
      min_select: g.min_select,
      max_select: g.max_select,
      modifier_count: Array.isArray(g.modifiers)
        ? (g.modifiers[0]?.count as number | undefined) ?? 0
        : 0,
    }));
    setGroups(mapped);
    setLoading(false);
    if (!selectedId && mapped.length > 0) setSelectedId(mapped[0].id);
    if (selectedId && !mapped.some((g) => g.id === selectedId)) {
      setSelectedId(mapped[0]?.id ?? null);
    }
  }, [currentOrg, selectedId]);

  useEffect(() => {
    void fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg]);

  // Load editor data when selection changes
  useEffect(() => {
    if (!selectedId) {
      setName("");
      setRequired(false);
      setActive(true);
      setMinSelect(0);
      setMaxSelect(1);
      setModifiers([]);
      setOriginalModIds(new Set());
      return;
    }
    let cancelled = false;
    setEditorLoading(true);
    (async () => {
      const [gRes, mRes] = await Promise.all([
        supabase
          .from("modifier_groups")
          .select("name, required, active, min_select, max_select")
          .eq("id", selectedId)
          .maybeSingle(),
        supabase
          .from("modifiers")
          .select("id, name, price_delta_cents, sort_order, active")
          .eq("group_id", selectedId)
          .order("sort_order"),
      ]);
      if (cancelled) return;
      if (gRes.error || mRes.error || !gRes.data) {
        console.error(gRes.error || mRes.error);
        toast.error(GENERIC_ERR);
        setEditorLoading(false);
        return;
      }
      setName(gRes.data.name);
      setRequired(gRes.data.required);
      setActive(gRes.data.active);
      setMinSelect(gRes.data.min_select);
      setMaxSelect(gRes.data.max_select);
      const rows: ModifierRow[] = (mRes.data ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        priceInput: centsToInput(m.price_delta_cents),
        sort_order: m.sort_order,
        active: m.active,
      }));
      setModifiers(rows);
      setOriginalModIds(new Set(rows.map((r) => r.id!).filter(Boolean)));
      setEditorLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const filteredModifiers = useMemo(
    () => modifiers.filter((m) => !m._deleted),
    [modifiers],
  );

  const newGroup = async () => {
    if (!currentOrg) return;
    const { data, error } = await supabase
      .from("modifier_groups")
      .insert({
        org_id: currentOrg.id,
        name: "Nieuwe groep",
        min_select: 0,
        max_select: 1,
        required: false,
        active: true,
      })
      .select("id")
      .single();
    if (error || !data) {
      toast.error(GENERIC_ERR);
      return;
    }
    await fetchGroups();
    setSelectedId(data.id);
  };

  const addModifier = () =>
    setModifiers((prev) => [
      ...prev,
      {
        name: "",
        priceInput: "0,00",
        sort_order: prev.length,
        active: true,
      },
    ]);

  const updateModifier = (idx: number, patch: Partial<ModifierRow>) =>
    setModifiers((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));

  const removeModifier = (idx: number) =>
    setModifiers((prev) => {
      const row = prev[idx];
      if (row.id) return prev.map((m, i) => (i === idx ? { ...m, _deleted: true } : m));
      return prev.filter((_, i) => i !== idx);
    });

  const handleSave = async () => {
    if (!currentOrg || !selectedId) return;
    if (!name.trim()) {
      toast.error("Geef de groep een naam.");
      return;
    }
    const min = required ? Math.max(1, minSelect) : minSelect;
    if (maxSelect < min) {
      toast.error("Maximum keuzes moet ≥ minimum zijn.");
      return;
    }

    setSaving(true);
    try {
      const orgId = currentOrg.id;

      const { error: gErr } = await supabase
        .from("modifier_groups")
        .update({
          name: name.trim(),
          required,
          active,
          min_select: min,
          max_select: maxSelect,
        })
        .eq("id", selectedId);
      if (gErr) throw gErr;

      const aliveIds = new Set(
        modifiers.filter((m) => m.id && !m._deleted).map((m) => m.id!),
      );
      const toDelete = [...originalModIds].filter((id) => !aliveIds.has(id));
      if (toDelete.length > 0) {
        const { error } = await supabase.from("modifiers").delete().in("id", toDelete);
        if (error) throw error;
      }

      const inserts = modifiers.filter((m) => !m.id && !m._deleted && m.name.trim());
      if (inserts.length > 0) {
        const { error } = await supabase.from("modifiers").insert(
          inserts.map((m) => ({
            org_id: orgId,
            group_id: selectedId,
            name: m.name.trim(),
            price_delta_cents: inputToCents(m.priceInput),
            sort_order: m.sort_order,
            active: m.active,
          })),
        );
        if (error) throw error;
      }

      const updates = modifiers.filter((m) => m.id && !m._deleted);
      for (const m of updates) {
        const { error } = await supabase
          .from("modifiers")
          .update({
            name: m.name.trim(),
            price_delta_cents: inputToCents(m.priceInput),
            sort_order: m.sort_order,
            active: m.active,
          })
          .eq("id", m.id!);
        if (error) throw error;
      }

      toast.success("Groep opgeslagen.");
      await fetchGroups();
    } catch (e) {
      console.error(e);
      toast.error("Opslaan mislukt. Probeer opnieuw.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    const { error } = await supabase.from("modifier_groups").delete().eq("id", selectedId);
    if (error) {
      toast.error(GENERIC_ERR);
      return;
    }
    toast.success("Groep verwijderd.");
    setSelectedId(null);
    setConfirmDelete(false);
    await fetchGroups();
  };

  // Auto-bump min when toggling required
  useEffect(() => {
    if (required && minSelect < 1) setMinSelect(1);
  }, [required, minSelect]);

  return (
    <>
      <PageHeader
        title="Modifier-groepen"
        subtitle="Herbruikbare opties die je aan producten kunt koppelen. Bijv. Melkkeuze of Extra toevoegingen."
        action={
          <Button onClick={newGroup} className="gap-2">
            <Plus className="h-4 w-4" /> Nieuwe groep
          </Button>
        }
      />

      {!loading && groups.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Layers className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Nog geen modifier-groepen</p>
            <p className="text-sm text-muted-foreground">
              Maak een groep om opties zoals melkkeuze of extra toppings te beheren.
            </p>
          </div>
          <Button onClick={newGroup} className="gap-2">
            <Plus className="h-4 w-4" /> Nieuwe groep
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
                {groups.map((g) => (
                  <li key={g.id}>
                    <button
                      onClick={() => setSelectedId(g.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                        selectedId === g.id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted",
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{g.name}</span>
                          {!g.active && (
                            <span className="text-[10px] uppercase text-muted-foreground">
                              inactief
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {g.modifier_count} {g.modifier_count === 1 ? "optie" : "opties"}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          g.active ? "bg-emerald-500" : "bg-muted-foreground/40",
                        )}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            {!selectedId ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
                Selecteer een groep om te bewerken.
              </div>
            ) : editorLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-9 w-1/2" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="font-normal">
                    Groep
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDelete(true)}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Verwijderen
                    </Button>
                    <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
                      <Save className="h-4 w-4" />
                      {saving ? "Opslaan…" : "Opslaan"}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="g-name">Naam</Label>
                    <Input
                      id="g-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Melkkeuze"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="g-min">Minimum keuzes</Label>
                    <Input
                      id="g-min"
                      type="number"
                      min={0}
                      value={minSelect}
                      onChange={(e) => setMinSelect(Math.max(0, Number(e.target.value) || 0))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="g-max">Maximum keuzes</Label>
                    <Input
                      id="g-max"
                      type="number"
                      min={1}
                      value={maxSelect}
                      onChange={(e) => setMaxSelect(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <Label htmlFor="g-req" className="cursor-pointer text-sm">
                      Verplicht
                    </Label>
                    <Switch id="g-req" checked={required} onCheckedChange={setRequired} />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <Label htmlFor="g-act" className="cursor-pointer text-sm">
                      Actief
                    </Label>
                    <Switch id="g-act" checked={active} onCheckedChange={setActive} />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label>Modifiers</Label>
                  </div>
                  <div className="overflow-hidden rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-left">Naam</th>
                          <th className="px-3 py-2 text-left">Prijs-verschil</th>
                          <th className="w-20 px-3 py-2 text-left">Sorteer</th>
                          <th className="w-16 px-3 py-2 text-center">Actief</th>
                          <th className="w-12" />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredModifiers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-3 py-6 text-center text-xs text-muted-foreground"
                            >
                              Nog geen modifiers.
                            </td>
                          </tr>
                        ) : (
                          modifiers.map((m, idx) =>
                            m._deleted ? null : (
                              <tr
                                key={m.id ?? `new-${idx}`}
                                className="border-t"
                              >
                                <td className="px-3 py-2">
                                  <Input
                                    value={m.name}
                                    onChange={(e) =>
                                      updateModifier(idx, { name: e.target.value })
                                    }
                                    placeholder="Soja melk"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <Input
                                      inputMode="decimal"
                                      className="w-28"
                                      value={m.priceInput}
                                      onChange={(e) =>
                                        updateModifier(idx, { priceInput: e.target.value })
                                      }
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      {formatPriceDelta(inputToCents(m.priceInput))}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <Input
                                    type="number"
                                    value={m.sort_order}
                                    onChange={(e) =>
                                      updateModifier(idx, {
                                        sort_order: Number(e.target.value) || 0,
                                      })
                                    }
                                  />
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <Switch
                                    checked={m.active}
                                    onCheckedChange={(c) =>
                                      updateModifier(idx, { active: c })
                                    }
                                  />
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => removeModifier(idx)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </td>
                              </tr>
                            ),
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addModifier}
                    className="mt-3 gap-2"
                  >
                    <Plus className="h-4 w-4" /> Modifier toevoegen
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Groep verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze groep wordt losgekoppeld van alle producten. Reeds afgerekende bestellingen
              blijven ongewijzigd. Weet je het zeker?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
