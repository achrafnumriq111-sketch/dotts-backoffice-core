import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/context/OrgContext";
import { usePositions, type Position } from "@/hooks/usePositions";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  getPermission,
  type PermissionKey,
  type PositionPermissions,
} from "@/hooks/usePositionPermissions";

type Drafts = Record<string, PositionPermissions>;

export function PositionPermissionsTab() {
  const { currentOrg } = useOrg();
  const { data: positions = [], isLoading } = usePositions(currentOrg?.id);
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Drafts>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const next: Drafts = {};
    for (const p of positions) {
      const perms = (p.permissions ?? {}) as PositionPermissions;
      const filled: PositionPermissions = {};
      for (const k of PERMISSION_KEYS) {
        filled[k] = getPermission(perms, k);
      }
      next[p.id] = filled;
    }
    setDrafts(next);
  }, [positions]);

  function toggle(positionId: string, key: PermissionKey, value: boolean) {
    setDrafts((prev) => ({
      ...prev,
      [positionId]: { ...(prev[positionId] ?? {}), [key]: value },
    }));
  }

  async function save(p: Position) {
    if (!currentOrg) return;
    setSaving(p.id);
    try {
      const perms = drafts[p.id] ?? {};
      const { error } = await supabase.rpc("upsert_position", {
        p_org_id: currentOrg.id,
        p_id: p.id,
        p_name: p.name,
        p_color: p.color ?? "#64748B",
        p_default_hourly_wage_cents: p.default_hourly_wage_cents ?? undefined,
        p_sort_order: p.sort_order,
        p_permissions: perms as never,
      } as never);
      if (error) throw error;
      toast.success(`Rechten voor ${p.name} opgeslagen`);
      qc.invalidateQueries({ queryKey: ["positions", currentOrg.id] });
      qc.invalidateQueries({ queryKey: ["employees", currentOrg.id] });
      qc.invalidateQueries({ queryKey: ["my-position-permissions"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Er ging iets mis";
      toast.error(msg);
    } finally {
      setSaving(null);
    }
  }

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (positions.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-muted-foreground">
        Maak eerst een functie aan onder het tabblad "Functies".
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[160px]">Functie</TableHead>
            {PERMISSION_KEYS.map((k) => (
              <TableHead key={k} className="text-center text-xs">
                {PERMISSION_LABELS[k]}
              </TableHead>
            ))}
            <TableHead className="w-28 text-right">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((p) => {
            const draft = drafts[p.id] ?? {};
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <Badge className="border-0 text-white" style={{ backgroundColor: p.color ?? undefined }}>
                    {p.name}
                  </Badge>
                </TableCell>
                {PERMISSION_KEYS.map((k) => (
                  <TableCell key={k} className="text-center">
                    <Switch
                      checked={Boolean(draft[k])}
                      onCheckedChange={(v) => toggle(p.id, k, v)}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => save(p)}
                    disabled={saving === p.id}
                    className="gap-1"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saving === p.id ? "…" : "Opslaan"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
