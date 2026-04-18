import { Check, ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { useOrg } from "@/context/OrgContext";
import { t } from "@/lib/i18n";

function initials(value: string) {
  return value
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar() {
  const { user, signOut } = useAuth();
  const { orgs, currentOrg, switchOrg, loading: orgLoading } = useOrg();
  const tr = t();

  const email = user?.email ?? "";
  const display = email || "—";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-3 backdrop-blur sm:px-4">
      <SidebarTrigger className="text-muted-foreground" />

      <div className="flex flex-1 items-center justify-center">
        {orgLoading ? (
          <Skeleton className="h-7 w-40" />
        ) : currentOrg ? (
          orgs.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 gap-1.5 px-3 text-sm font-medium"
                >
                  {currentOrg.name}
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuLabel>Organisatie</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {orgs.map((m) => (
                  <DropdownMenuItem
                    key={m.org_id}
                    onClick={() => switchOrg(m.org_id)}
                    className="flex items-center justify-between"
                  >
                    <span className="truncate">{m.organization.name}</span>
                    {m.org_id === currentOrg.id && (
                      <Check className="ml-2 h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className="rounded-md bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              {currentOrg.name}
            </span>
          )
        ) : null}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 gap-2 px-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {email ? initials(email) : "?"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[180px] truncate text-sm sm:inline">{display}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="truncate text-sm font-medium">{display}</span>
              <span className="text-xs text-muted-foreground">Ingelogd</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserIcon className="mr-2 h-4 w-4" />
            {tr.topbar.myAccount}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            {tr.topbar.signOut}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
