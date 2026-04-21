import { AlertTriangle, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conflict } from "@/lib/shiftConflicts";

export function ConflictBadge({ conflict, className }: { conflict: Conflict; className?: string }) {
  if (conflict === "none") return null;
  const isHard = conflict === "hard";
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border p-2 text-xs",
        isHard
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
        className,
      )}
    >
      {isHard ? <Ban className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
      <span>
        {isHard
          ? "Conflict: goedgekeurd verlof op deze dag."
          : "Conflict: buiten beschikbaarheid."}
      </span>
    </div>
  );
}