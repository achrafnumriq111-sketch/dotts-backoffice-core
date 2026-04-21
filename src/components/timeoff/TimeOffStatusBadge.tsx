import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["time_off_status"];

const LABELS: Record<Status, string> = {
  pending: "In behandeling",
  approved: "Goedgekeurd",
  rejected: "Afgewezen",
  cancelled: "Geannuleerd",
};

const CLASSES: Record<Status, string> = {
  pending: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export function TimeOffStatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant="outline" className={CLASSES[status]}>
      {LABELS[status]}
    </Badge>
  );
}

export const TIME_OFF_TYPE_LABELS: Record<Database["public"]["Enums"]["time_off_type"], string> = {
  vakantie: "Vakantie",
  ziekte: "Ziekte",
  bijzonder: "Bijzonder verlof",
  onbetaald: "Onbetaald",
  overig: "Overig",
};
