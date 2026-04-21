import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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