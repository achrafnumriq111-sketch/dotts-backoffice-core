import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type NotificationSeverity = "info" | "warning" | "critical";

export interface AppNotification {
  id: string;
  severity: NotificationSeverity;
  title: string;
  description?: string;
  read?: boolean;
  /** Whether this notification locks the app (only meaningful for critical). */
  blocking?: boolean;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  topNotification: AppNotification | null;
  isAccountBlocked: boolean;
  // Mocked controls
  setBlocked: (blocked: boolean) => void;
  dismiss: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

const SEVERITY_RANK: Record<NotificationSeverity, number> = {
  info: 0,
  warning: 1,
  critical: 2,
};

const INITIAL: AppNotification[] = [
  {
    id: "n_invoice_due",
    severity: "warning",
    title: "Factuur 2025-0042 vervalt over 3 dagen",
    description: "Bedrag € 79,00 — vervaldatum 21-04-2026.",
  },
];

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL);
  const [blocked, setBlocked] = useState(false);

  const value = useMemo<NotificationsContextValue>(() => {
    const list = blocked
      ? [
          {
            id: "n_blocked",
            severity: "critical" as const,
            title: "Account geblokkeerd — betaling vereist",
            description: "Voltooi de openstaande betaling om weer toegang te krijgen.",
            blocking: true,
          },
          ...notifications,
        ]
      : notifications;

    const unread = list.filter((n) => !n.read);
    const top =
      unread.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0] ?? null;

    return {
      notifications: list,
      topNotification: top,
      isAccountBlocked: blocked,
      setBlocked,
      dismiss: (id: string) =>
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))),
    };
  }, [notifications, blocked]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
