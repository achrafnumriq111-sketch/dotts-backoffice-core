import { Ban, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Conflict } from "@/lib/shiftConflicts";

interface Props {
  startsAt: string;
  endsAt: string;
  positionName?: string | null;
  positionColor?: string | null;
  conflict?: Conflict;
  status?: string;
  unassigned?: boolean;
  onClick?: () => void;
}

export function ShiftChip({
  startsAt,
  endsAt,
  positionName,
  positionColor,
  conflict = "none",
  status,
  unassigned,
  onClick,
}: Props) {
  const time = `${format(new Date(startsAt), "HH:mm")}–${format(new Date(endsAt), "HH:mm")}`;
  const color = positionColor || "hsl(var(--muted-foreground))";
  const isDraft = status === "draft";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-md border-l-[3px] bg-card p-1.5 text-left text-xs shadow-sm transition-colors hover:bg-muted/50",
        conflict === "hard" && "border border-destructive/60 ring-1 ring-destructive/40",
        conflict === "soft" && "border border-amber-500/60",
        conflict === "none" && "border border-border",
        isDraft && "opacity-80",
      )}
      style={{ borderLeftColor: color }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 font-medium">
          <span>{time}</span>
          {conflict === "hard" && <Ban className="h-3 w-3 text-destructive" />}
          {conflict === "soft" && <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />}
        </div>
        {positionName && <div className="truncate text-[10px] text-muted-foreground">{positionName}</div>}
        {unassigned && (
          <div className="text-[10px] font-medium text-muted-foreground">Niet toegewezen</div>
        )}
      </div>
      {isDraft && (
        <span className="rounded bg-muted px-1 text-[9px] uppercase text-muted-foreground">Concept</span>
      )}
    </button>
  );
}