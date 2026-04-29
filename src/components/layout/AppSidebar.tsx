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
  UserCircle,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { t } from "@/lib/i18n";
import { DottsLogo } from "./DottsLogo";
import { useOrg } from "@/context/OrgContext";
import { useTeamPermissions } from "@/hooks/useTeamPermissions";
import { supabase } from "@/integrations/supabase/client";
import { useDraftShiftsCount } from "@/hooks/useShifts";

const items = [
  { titleKey: "dashboard", url: "/dashboard", icon: Home, end: true },
  { titleKey: "register", url: "/kassa", icon: ShoppingCart, end: true },
  { titleKey: "products", url: "/producten", icon: Package, end: false },
  { titleKey: "sales", url: "/verkopen", icon: Receipt, end: true },
  { titleKey: "closing", url: "/kasafsluiting", icon: Calculator, end: true },
  { titleKey: "locations", url: "/locaties", icon: MapPin, end: true },
  { titleKey: "team", url: "/team", icon: Users, end: false },
  { titleKey: "settings", url: "/instellingen", icon: Settings, end: true },
  { titleKey: "subscription", url: "/abonnement", icon: CreditCard, end: true },
] as const;

const productsSubItems = [
  { titleKey: "productsAll", url: "/producten", end: true },
  { titleKey: "productsCategories", url: "/producten/categorieen", end: true },
  { titleKey: "productsModifierGroups", url: "/producten/modifier-groepen", end: true },
] as const;

const teamSubItems = [
  { label: "Medewerkers", url: "/team", end: true, adminOnly: false },
  { label: "Beschikbaarheid", url: "/team/beschikbaarheid", end: true, adminOnly: true },
  { label: "Verlof", url: "/team/verlof", end: true, adminOnly: true, badge: "pending" as const },
  { label: "Roosters", url: "/team/roosters", end: true, adminOnly: true, badge: "drafts" as const },
] as const;

const myItems = [
  { label: "Beschikbaarheid", url: "/mijn/beschikbaarheid", end: true },
  { label: "Verlof", url: "/mijn/verlof", end: true },
  { label: "Rooster", url: "/mijn/rooster", end: true },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const tr = t();
  const location = useLocation();
  const inProducts = location.pathname.startsWith("/producten");
  const inTeam = location.pathname.startsWith("/team");
  const inMijn = location.pathname.startsWith("/mijn");

  const { currentOrg } = useOrg();
  const { canReviewTimeOff, myEmployeeId } = useTeamPermissions();
  const orgId = currentOrg?.id;

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["timeoff-pending-count", orgId],
    enabled: !!orgId && canReviewTimeOff,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("time_off_requests")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId!)
        .eq("status", "pending");
      return count ?? 0;
    },
  });

  const { data: draftShiftsCount = 0 } = useDraftShiftsCount(canReviewTimeOff ? orgId : null);

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
                      end={item.end}
                      className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{tr.nav[item.titleKey]}</span>}
                    </NavLink>
                  </SidebarMenuButton>

                  {item.titleKey === "products" && inProducts && !collapsed && (
                    <SidebarMenu className="ml-7 mt-1 border-l border-sidebar-border pl-2">
                      {productsSubItems.map((sub) => (
                        <SidebarMenuItem key={sub.url}>
                          <NavLink
                            to={sub.url}
                            end={sub.end}
                            className="block rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          >
                            {tr.nav[sub.titleKey]}
                          </NavLink>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  )}

                  {item.titleKey === "team" && inTeam && !collapsed && (
                    <SidebarMenu className="ml-7 mt-1 border-l border-sidebar-border pl-2">
                      {teamSubItems
                        .filter((sub) => !sub.adminOnly || canReviewTimeOff)
                        .map((sub) => (
                          <SidebarMenuItem key={sub.url}>
                            <NavLink
                              to={sub.url}
                              end={sub.end}
                              className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            >
                              <span className="truncate">{sub.label}</span>
                              {"badge" in sub && sub.badge === "pending" && pendingCount > 0 && (
                                <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                                  {pendingCount}
                                </span>
                              )}
                              {"badge" in sub && sub.badge === "drafts" && draftShiftsCount > 0 && (
                                <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                                  {draftShiftsCount}
                                </span>
                              )}
                            </NavLink>
                          </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {myEmployeeId && (
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel>Mijn</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Mijn">
                    <NavLink
                      to="/mijn/beschikbaarheid"
                      className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <UserCircle className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">Mijn</span>}
                    </NavLink>
                  </SidebarMenuButton>

                  {inMijn && !collapsed && (
                    <SidebarMenu className="ml-7 mt-1 border-l border-sidebar-border pl-2">
                      {myItems.map((sub) => (
                        <SidebarMenuItem key={sub.url}>
                          <NavLink
                            to={sub.url}
                            end={sub.end}
                            className="block rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          >
                            {sub.label}
                          </NavLink>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
