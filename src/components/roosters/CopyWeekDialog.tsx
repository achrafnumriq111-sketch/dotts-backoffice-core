import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatWeekLabel, toIsoDate, weekStart as getWeekStart } from "@/lib/dateNl";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  locationId: string;
  sourceWeekStart: Date;
}

export function CopyWeekDialog({ open, onOpenChange, locationId, sourceWeekStart }: Props) {
  const qc = useQueryClient();
  const [target, setTarget] = useState<Date>(getWeekStart(new Date(sourceWeekStart.getTime() + 7 * 86400000)));

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("copy_week", {
        p_location_id: locationId,
        p_source_week_start: toIsoDate(sourceWeekStart),
        p_target_week_start: toIsoDate(target),
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["shifts-week"] });
      qc.invalidateQueries({ queryKey: ["shifts-draft-count"] });
      toast.success(`${count} shift${count === 1 ? "" : "s"} gekopieerd`);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message || "Niet toegestaan"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Kopieer week</DialogTitle>
          <DialogDescription>
            Kopieer van <span className="font-medium">{formatWeekLabel(sourceWeekStart)}</span> naar de gekozen week. Doel-shifts worden als concept toegevoegd.
          </DialogDescription>
        </DialogHeader>

        <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start gap-2 text-left font-normal")}>
                <CalendarIcon className="h-4 w-4" />
                {formatWeekLabel(target)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={target}
                onSelect={(d) => d && setTarget(getWeekStart(d))}
                weekStartsOn={1}
                locale={nl}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Kopieer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}