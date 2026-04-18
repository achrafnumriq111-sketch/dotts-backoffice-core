import { AlertTriangle, Info, X } from "lucide-react";
import { useNotifications } from "@/context/NotificationsContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NotificationsBanner() {
  const { topNotification, dismiss } = useNotifications();
  if (!topNotification) return null;
  // Critical is rendered as a full-page overlay by AppLayout.
  if (topNotification.severity === "critical") return null;

  const { id, severity, title, body } = topNotification;

  const styles =
    severity === "warning"
      ? "bg-warning-muted text-foreground border-warning/40"
      : "bg-info-muted text-foreground border-info/30";

  const Icon = severity === "warning" ? AlertTriangle : Info;

  return (
    <div
      className={cn("flex items-start gap-3 border-b px-4 py-3 text-sm", styles)}
      role="alert"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight">{title}</p>
        {body && <p className="mt-0.5 text-xs opacity-90">{body}</p>}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 hover:bg-black/5"
        onClick={() => dismiss(id)}
        aria-label="Sluiten"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
