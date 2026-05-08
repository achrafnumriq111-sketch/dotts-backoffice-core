import { Outlet, NavLink as RouterNavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Receipt,
  LogOut,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/superadmin", label: "Overzicht", icon: LayoutDashboard, end: true },
  { to: "/superadmin/clients", label: "Klanten", icon: Building2, end: false },
  { to: "/superadmin/invoices", label: "Facturen", icon: Receipt, end: false },
] as const;

export function SuperAdminLayout() {
  const { signOut, user } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-border bg-card">
        {/* Logo / brand */}
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">Dotts Admin</span>
        </div>

        <nav className="flex-1 space-y-0.5 p-2 pt-3">
          {navItems.map((item) => (
            <RouterNavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </RouterNavLink>
          ))}
        </nav>

        {/* Bottom: user + sign out */}
        <div className="border-t border-border p-3 space-y-2">
          <p className="truncate px-1 text-xs text-muted-foreground">
            {user?.email ?? "—"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Uitloggen
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
