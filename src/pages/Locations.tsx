import { MapPin, Plus, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";

const LOCATIONS = [
  {
    id: "1",
    name: "Brouwcafé De Hoek",
    address: "Hoofdstraat 12, 1012 AB Amsterdam",
    primary: true,
  },
  {
    id: "2",
    name: "De Hoek — Strandtent",
    address: "Boulevard 8, 2042 LC Zandvoort",
    primary: false,
  },
];

export default function Locations() {
  const tr = t();
  return (
    <>
      <PageHeader
        title={tr.locations.title}
        subtitle={tr.locations.subtitle}
        action={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {tr.locations.newLocation}
          </Button>
        }
      />

      <div className="grid gap-3">
        {LOCATIONS.map((l) => (
          <Card key={l.id} className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-muted text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-medium">{l.name}</h3>
                {l.primary && (
                  <Badge className="bg-primary-muted text-primary hover:bg-primary-muted border-0">
                    {tr.locations.primary}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{l.address}</p>
            </div>
            <Button variant="ghost" size="sm" className="gap-2">
              <Pencil className="h-4 w-4" />
              {tr.common.edit}
            </Button>
          </Card>
        ))}
      </div>
    </>
  );
}
