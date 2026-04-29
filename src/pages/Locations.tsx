import { useEffect, useState } from "react";
import { MapPin, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/context/OrgContext";
import { LocationDialog, type LocationDialogRow } from "@/components/locations/LocationDialog";

interface LocationRow {
  id: string;
  name: string;
  is_primary: boolean;
  is_active: boolean;
  address_street: string | null;
  address_postal_code: string | null;
  address_city: string | null;
  address_country: string | null;
  phone: string | null;
  email: string | null;
}

function formatAddress(l: LocationRow): string | null {
  const street = l.address_street?.trim();
  const postal = l.address_postal_code?.trim();
  const city = l.address_city?.trim();
  if (!street && !postal && !city) return null;
  const right = [postal, city].filter(Boolean).join(" ");
  return [street, right].filter(Boolean).join(", ");
}

export default function Locations() {
  const tr = t();
  const { currentOrg } = useOrg();
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingLocation, setEditingLocation] = useState<LocationDialogRow | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!currentOrg) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("locations")
        .select(
          "id, name, is_primary, is_active, address_street, address_postal_code, address_city, address_country, phone, email",
        )
        .eq("org_id", currentOrg.id)
        .order("is_primary", { ascending: false })
        .order("name", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error("locations load failed", error);
        toast.error("Er ging iets mis bij het laden");
        setRows([]);
      } else {
        setRows((data ?? []) as LocationRow[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentOrg, reloadTick]);

  const openCreate = () => {
    setDialogMode("create");
    setEditingLocation(null);
    setDialogOpen(true);
  };

  const openEdit = (row: LocationRow) => {
    setDialogMode("edit");
    setEditingLocation(row);
    setDialogOpen(true);
  };

  const handleSaved = () => setReloadTick((n) => n + 1);

  return (
    <>
      <PageHeader
        title={tr.locations.title}
        subtitle={tr.locations.subtitle}
        action={
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {tr.locations.newLocation}
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-3">
          {[0, 1].map((i) => (
            <Card key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
            </Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-muted text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            Geen locaties. Maak je eerste vestiging aan.
          </p>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {tr.locations.newLocation}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((l) => {
            const address = formatAddress(l);
            return (
              <Card key={l.id} className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-muted text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium">{l.name}</h3>
                    {l.is_primary && (
                      <Badge className="bg-primary-muted text-primary hover:bg-primary-muted border-0">
                        {tr.locations.primary}
                      </Badge>
                    )}
                    {!l.is_active && (
                      <Badge variant="secondary" className="border-0">
                        Inactief
                      </Badge>
                    )}
                  </div>
                  {address ? (
                    <p className="text-sm text-muted-foreground">{address}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 italic">
                      Adres nog niet ingevuld
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => openEdit(l)}>
                  <Pencil className="h-4 w-4" />
                  {tr.common.edit}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {currentOrg && (
        <LocationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          mode={dialogMode}
          location={editingLocation}
          orgId={currentOrg.id}
          orgName={currentOrg.name}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
