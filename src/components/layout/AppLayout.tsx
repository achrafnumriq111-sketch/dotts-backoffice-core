import { Outlet } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { NotificationsBanner } from "./NotificationsBanner";
import { useNotifications } from "@/context/NotificationsContext";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { isAccountBlocked } = useNotifications();
  const tr = t();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <NotificationsBanner />
          <main className="relative flex-1">
            <div
              className={cn(
                "px-4 py-6 sm:px-6 lg:px-8 transition-opacity",
                isAccountBlocked && "pointer-events-none select-none opacity-30",
              )}
            >
              <Outlet />
            </div>
            {isAccountBlocked && (
              <div className="pointer-events-auto absolute inset-0 flex items-center justify-center p-6">
                <div className="max-w-md rounded-lg border border-destructive/30 bg-card p-6 text-center shadow-lg">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                    <ShieldAlert className="h-6 w-6 text-destructive" />
                  </div>
                  <h2 className="text-lg font-semibold">{tr.notifications.accountBlocked}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tr.notifications.accountBlockedDesc}
                  </p>
                </div>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
