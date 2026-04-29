import { useState } from "react";
import { AlertTriangle, Info, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/context/NotificationsContext";
import { useOrg } from "@/context/OrgContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export function NotificationsBanner() {
  const { topNotification, dismiss } = useNotifications();
  const { currentOrg } = useOrg();
  const [loading, setLoading] = useState(false);
  if (!topNotification) return null;
  // Critical is rendered as a full-page overlay by AppLayout.
  if (topNotification.severity === "critical") return null;

  const { id, kind, severity, title, body } = topNotification;

  // Normalise currency formatting in stored notification text so that
  // amounts like "EUR 499" render with the project's standard "€ 499" style.
  const formatCurrencyText = (s: string | null): string | null => {
    if (!s) return s;
    return s.replace(/\bEUR\s+/g, "€ ");
  };
  const displayTitle = formatCurrencyText(title) ?? title;
  const displayBody = formatCurrencyText(body);

  const styles =
    severity === "warning"
      ? "bg-warning-muted text-foreground border-warning/40"
      : "bg-info-muted text-foreground border-info/30";

  const Icon = severity === "warning" ? AlertTriangle : Info;

  const isSetupFee = kind === "setup_fee_pending";

  const startCheckout = async () => {
    if (!currentOrg) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("create-checkout-session", {
      body: { org_id: currentOrg.id },
    });
    setLoading(false);
    if (error) {
      toast.error("Checkout starten mislukt: " + error.message);
      return;
    }
    if (data?.url) {
      window.location.href = data.url as string;
    } else {
      toast.error("Checkout starten mislukt");
    }
  };

  return (
    <div
      className={cn("flex items-start gap-3 border-b px-4 py-3 text-sm", styles)}
      role="alert"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight">{displayTitle}</p>
        {displayBody && <p className="mt-0.5 text-xs opacity-90">{displayBody}</p>}
      </div>
      {isSetupFee && (
        <Button
          size="sm"
          onClick={startCheckout}
          disabled={loading}
          className="shrink-0"
        >
          {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Start betaling
        </Button>
      )}
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
