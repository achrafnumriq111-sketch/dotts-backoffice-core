import { Link } from "react-router-dom";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Employee } from "@/hooks/useEmployees";

function initials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  vast: "Vast",
  flex: "Flex",
  oproep: "Oproep",
  stagiair: "Stagiair",
  zzp: "ZZP",
};

export function EmployeeCard({ employee }: { employee: Employee }) {
  const positionColor = employee.positions?.color ?? "hsl(var(--muted))";
  const linked = !!employee.user_id;
  const invited = !linked && !!employee.invited_at;
  const linkState: "linked" | "invited" | "unlinked" = linked
    ? "linked"
    : invited
      ? "invited"
      : "unlinked";
  const linkBadgeClass =
    linkState === "linked"
      ? "border-success/30 bg-success-muted text-success"
      : linkState === "invited"
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-muted bg-muted text-muted-foreground";
  const linkBadgeLabel =
    linkState === "linked"
      ? "Gekoppeld"
      : linkState === "invited"
        ? "Uitgenodigd"
        : "Niet gekoppeld";
  const linkTooltip =
    linkState === "linked"
      ? employee.email
        ? `Gekoppeld (${employee.email})`
        : "Gekoppeld aan een account"
      : linkState === "invited"
        ? `Uitgenodigd op ${format(new Date(employee.invited_at!), "d MMM yyyy", { locale: nl })}`
        : "Klik om te bewerken en een account te koppelen";
  return (
    <Link to={`/team/${employee.id}`}>
      <Card className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40">
        <Avatar className="h-10 w-10">
          <AvatarFallback
            className="text-xs font-medium text-white"
            style={{ backgroundColor: positionColor }}
          >
            {initials(employee.first_name, employee.last_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">
              {employee.first_name} {employee.last_name}
            </p>
            {employee.positions && (
              <Badge
                className="border-0 text-white"
                style={{ backgroundColor: employee.positions.color ?? undefined }}
              >
                {employee.positions.name}
              </Badge>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className={linkBadgeClass}>
                    {linkBadgeLabel}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>{linkTooltip}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {EMPLOYMENT_LABELS[employee.employment_type] ?? employee.employment_type}
            {employee.contract_hours_per_week ? ` · ${employee.contract_hours_per_week} u/week` : ""}
            {employee.email ? ` · ${employee.email}` : ""}
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            employee.is_active
              ? "border-success/30 bg-success-muted text-success"
              : "border-muted bg-muted text-muted-foreground"
          }
        >
          {employee.is_active ? "Actief" : "Gearchiveerd"}
        </Badge>
      </Card>
    </Link>
  );
}