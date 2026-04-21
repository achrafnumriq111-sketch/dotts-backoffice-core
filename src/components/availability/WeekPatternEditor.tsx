import { useState } from "react";
import { Pencil, Plus, Trash2, Copy } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { DAY_LABELS_LONG, trimTime } from "@/lib/dateNl";
import { useAvailabilityPatterns, type AvailabilityPattern } from "@/hooks/useAvailability";
import { AvailabilityBlockDialog } from "./AvailabilityBlockDialog";

interface Props {
  employeeId: string;
}

export function WeekPatternEditor({ employeeId }: Props) {
  const qc = useQueryClient();
  const { data: patterns = [], isLoading } = useAvailabilityPatterns(employeeId);
  const [dialog, setDialog] = useState<{ day: number; pattern: AvailabilityPattern | null } | null>(null);
  const [copying, setCopying] = useState(false);

  const byDay = new Map<number, AvailabilityPattern[]>();
  for (let d = 1; d <= 7; d++) byDay.set(d, []);
  for (const p of patterns) byDay.get(p.day_of_week)?.push(p);

  async function deletePattern(id: string) {
    const { error } = await supabase.rpc("delete_availability_pattern", { p_id: id });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Blok verwijderd");
    qc.invalidateQueries({ queryKey: ["availability_patterns", employeeId] });
    qc.invalidateQueries({ queryKey: ["team_availability"] });
  }

  async function copyMondayToWeek() {
    const monday = byDay.get(1) ?? [];
    if (monday.length === 0) {
      toast.error("Voeg eerst een blok op maandag toe");
      return;
    }
    setCopying(true);
    try {
      for (let day = 2; day <= 5; day++) {
        for (const p of monday) {
          const { error } = await supabase.rpc("upsert_availability_pattern", {
            p_employee_id: employeeId,
            p_day_of_week: day,
            p_start_time: p.start_time,
            p_end_time: p.end_time,
            p_is_available: p.is_available,
            p_notes: p.notes ?? undefined,
          });
          if (error) throw error;
        }
      }
      toast.success("Maandag gekopieerd naar werkweek");
      qc.invalidateQueries({ queryKey: ["availability_patterns", employeeId] });
      qc.invalidateQueries({ queryKey: ["team_availability"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Niet gelukt");
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Dit is je standaard wekelijkse patroon. Voor losse afwijkingen, gebruik uitzonderingen hieronder.
        </p>
        <Button variant="outline" size="sm" onClick={copyMondayToWeek} disabled={copying} className="gap-2">
          <Copy className="h-3.5 w-3.5" />
          Kopieer ma → wk
        </Button>
      </div>

      <div className="grid gap-2 md:grid-cols-7">
        {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
          const blocks = byDay.get(day) ?? [];
          return (
            <Card key={day} className="flex min-h-[160px] flex-col p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {DAY_LABELS_LONG[day - 1]}
              </div>
              <div className="flex-1 space-y-1.5">
                {isLoading ? (
                  <div className="h-6 animate-pulse rounded bg-muted" />
                ) : blocks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Geen blokken</p>
                ) : (
                  blocks.map((b) => (
                    <div
                      key={b.id}
                      className="group flex items-center justify-between rounded-md border border-border bg-card px-2 py-1.5 text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {trimTime(b.start_time)} – {trimTime(b.end_time)}
                        </span>
                        {!b.is_available && (
                          <Badge variant="outline" className="mt-1 w-fit border-destructive/30 bg-destructive/10 text-[10px] text-destructive">
                            Niet beschikbaar
                          </Badge>
                        )}
                      </div>
                      <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDialog({ day, pattern: b })}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deletePattern(b.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full justify-start gap-1 text-xs"
                onClick={() => setDialog({ day, pattern: null })}
              >
                <Plus className="h-3 w-3" /> Blok
              </Button>
            </Card>
          );
        })}
      </div>

      {dialog && (
        <AvailabilityBlockDialog
          open
          onOpenChange={(o) => !o && setDialog(null)}
          employeeId={employeeId}
          dayIso={dialog.day}
          pattern={dialog.pattern}
        />
      )}
    </div>
  );
}
