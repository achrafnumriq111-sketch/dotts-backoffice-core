import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { t } from "@/lib/i18n";

type Role = "owner" | "manager" | "employee";

const TEAM: { id: string; name: string; email: string; role: Role }[] = [
  { id: "1", name: "Sanne de Vries", email: "sanne@brouwcafe.nl", role: "owner" },
  { id: "2", name: "Lars Bakker", email: "lars@brouwcafe.nl", role: "manager" },
  { id: "3", name: "Yusuf Demir", email: "yusuf@brouwcafe.nl", role: "employee" },
  { id: "4", name: "Eva Jansen", email: "eva@brouwcafe.nl", role: "employee" },
];

const ROLE_STYLES: Record<Role, string> = {
  owner: "bg-primary-muted text-primary",
  manager: "bg-warning-muted text-warning",
  employee: "bg-secondary text-secondary-foreground",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Team() {
  const tr = t();
  return (
    <>
      <PageHeader
        title={tr.team.title}
        subtitle={tr.team.subtitle}
        action={
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            {tr.team.invite}
          </Button>
        }
      />

      <Card className="divide-y divide-border">
        {TEAM.map((m) => (
          <div key={m.id} className="flex items-center gap-4 p-4">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-secondary text-xs">{initials(m.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{m.name}</p>
              <p className="truncate text-sm text-muted-foreground">{m.email}</p>
            </div>
            <Badge className={`${ROLE_STYLES[m.role]} border-0 hover:opacity-100`}>
              {tr.team.roles[m.role]}
            </Badge>
          </div>
        ))}
      </Card>
    </>
  );
}
