import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { addDays, toIsoDate } from "@/lib/dateNlHelpers";

interface Props {
  locationId: string;
  weekStart: Date;
  draftCount: number;
}

export function PublishWeekButton({ locationId, weekStart, draftCount }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("publish_shifts_range", {
        p_location_id: locationId,
        p_from: toIsoDate(weekStart),
        p_to: toIsoDate(addDays(weekStart, 6)),
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["shifts-week"] });
      qc.invalidateQueries({ queryKey: ["my-shifts"] });
      qc.invalidateQueries({ queryKey: ["shifts-draft-count"] });
      toast.success(
        `${count} shift${count === 1 ? "" : "s"} gepubliceerd. Medewerkers zien hun rooster nu in /mijn/rooster.`,
      );
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || "Niet toegestaan"),
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button className="gap-2" disabled={draftCount === 0}>
          <Send className="h-4 w-4" />
          Publiceer week {draftCount > 0 && `(${draftCount})`}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Week publiceren?</AlertDialogTitle>
          <AlertDialogDescription>
            {draftCount} concept-shift{draftCount === 1 ? "" : "s"} worden gepubliceerd en zichtbaar voor medewerkers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuleren</AlertDialogCancel>
          <AlertDialogAction onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            Publiceren
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}