import {
  Home,
  ShoppingCart,
  Package,
  Receipt,
  Calculator,
  MapPin,
  Users,
  Settings,
  CreditCard,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { t } from "@/lib/i18n";
import { DottsLogo } from "./DottsLogo";

const items = [
  { titleKey: "dashboard", url: "/dashboard", icon: Home },
  { titleKey: "register", url: "/kassa", icon: ShoppingCart },
  { titleKey: "products", url: "/producten", icon: Package },
  { titleKey: "sales", url: "/verkopen", icon: Receipt },
  { titleKey: "closing", url: "/kasafsluiting", icon: Calculator },
  { titleKey: "locations", url: "/locaties", icon: MapPin },
  { titleKey: "team", url: "/team", icon: Users },
  { titleKey: "settings", url: "/instellingen", icon: Settings },
  { titleKey: "subscription", url: "/abonnement", icon: CreditCard },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const tr = t();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="grid grid-cols-2 gap-[3px]">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/70" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/70" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
            </span>
          </div>
        ) : (
          <DottsLogo />
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={tr.nav[item.titleKey]}>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{tr.nav[item.titleKey]}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
