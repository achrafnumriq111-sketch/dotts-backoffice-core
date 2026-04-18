import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "./OrgContext";

export type NotificationSeverity = "info" | "warning" | "critical";

export interface AppNotification {
  id: string;
  severity: NotificationSeverity;
  title: string;
  body: string | null;
  action_url: string | null;
  created_at: string;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  topNotification: AppNotification | null;
  isAccountBlocked: boolean;
  loading: boolean;
  dismiss: (id: string) => Promise<void>;
  refetch: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

const SEVERITY_RANK: Record<NotificationSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const isSeverity = (s: string): s is NotificationSeverity =>
  s === "info" || s === "warning" || s === "critical";

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { currentOrg } = useOrg();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetchKey, setRefetchKey] = useState(0);

  const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

  useEffect(() => {
    if (!currentOrg) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, severity, title, body, action_url, created_at")
        .eq("org_id", currentOrg.id)
        .is("dismissed_at", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled) return;

      if (error) {
        console.error("Failed to load notifications", error);
        toast.error("Er ging iets mis bij het laden");
        setLoading(false);
        return;
      }

      const mapped: AppNotification[] = (data ?? [])
        .filter((n) => isSeverity(n.severity))
        .map((n) => ({
          id: n.id,
          severity: n.severity as NotificationSeverity,
          title: n.title,
          body: n.body,
          action_url: n.action_url,
          created_at: n.created_at,
        }));

      setNotifications(mapped);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentOrg, refetchKey]);

  const dismiss = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const { error } = await supabase
      .from("notifications")
      .update({ dismissed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.error("Failed to dismiss notification", error);
      toast.error("Er ging iets mis bij het laden");
      refetch();
    }
  }, [refetch]);

  const value = useMemo<NotificationsContextValue>(() => {
    const sorted = [...notifications].sort(
      (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
    );
    const top = sorted[0] ?? null;
    return {
      notifications,
      topNotification: top,
      isAccountBlocked: top?.severity === "critical",
      loading,
      dismiss,
      refetch,
    };
  }, [notifications, loading, dismiss, refetch]);

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
