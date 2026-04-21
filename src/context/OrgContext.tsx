import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import type { Database, Tables } from "@/integrations/supabase/types";

const STORAGE_KEY = "dotts.currentOrgId";
const LOC_STORAGE_KEY = "dotts.currentLocationId";
const AUTH_BASE_URL = "https://auth.mydotts.nl";

export type OrgRole = Database["public"]["Enums"]["org_role"];

export interface OrgMembership {
  org_id: string;
  role: OrgRole;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

export type OrgFull = Tables<"organizations">;
export type LocationLite = { id: string; name: string; is_primary: boolean };

interface OrgContextValue {
  orgs: OrgMembership[];
  currentOrg: OrgMembership["organization"] | null;
  currentRole: OrgRole | null;
  currentOrgFull: OrgFull | null;
  locations: LocationLite[];
  currentLocation: LocationLite | null;
  setCurrentLocation: (locationId: string) => void;
  loading: boolean;
  switchOrg: (orgId: string) => void;
  refetchOrg: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [orgs, setOrgs] = useState<OrgMembership[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentOrgFull, setCurrentOrgFull] = useState<OrgFull | null>(null);
  const [locations, setLocations] = useState<LocationLite[]>([]);
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setOrgs([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!authUser) {
        setOrgs([]);
        setCurrentOrgId(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("org_members")
        .select("role, org_id, created_at, organizations(id, name, slug)")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("orgs load failed", error);
        toast.error("Er ging iets mis bij het laden");
        setOrgs([]);
        setCurrentOrgId(null);
        setLoading(false);
        return;
      }

      // Dedupe by org id (safety net in case RLS/join returns duplicates)
      const seen = new Set<string>();
      const memberships: OrgMembership[] = [];
      for (const row of data ?? []) {
        const org = row.organizations as OrgMembership["organization"] | null;
        if (!org || seen.has(org.id)) continue;
        seen.add(org.id);
        memberships.push({
          org_id: row.org_id,
          role: row.role,
          organization: org,
        });
      }

      if (memberships.length === 0) {
        window.location.href = `${AUTH_BASE_URL}/onboarding`;
        return;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      const initialId =
        stored && memberships.some((m) => m.org_id === stored)
          ? stored
          : memberships[0].org_id;

      setOrgs(memberships);
      setCurrentOrgId(initialId);
      localStorage.setItem(STORAGE_KEY, initialId);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const switchOrg = useCallback(
    (orgId: string) => {
      if (!orgs.some((m) => m.org_id === orgId)) return;
      setCurrentOrgId(orgId);
      localStorage.setItem(STORAGE_KEY, orgId);
    },
    [orgs],
  );

  const refetchOrg = useCallback(async () => {
    if (!currentOrgId) return;
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", currentOrgId)
      .maybeSingle();
    if (!error && data) setCurrentOrgFull(data as OrgFull);
  }, [currentOrgId]);

  useEffect(() => {
    if (!currentOrgId) {
      setCurrentOrgFull(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", currentOrgId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("org full load failed", error);
        return;
      }
      setCurrentOrgFull((data as OrgFull) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentOrgId]);

  // Load locations whenever org changes
  useEffect(() => {
    if (!currentOrgId) {
      setLocations([]);
      setCurrentLocationId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name, is_primary")
        .eq("org_id", currentOrgId)
        .eq("is_active", true)
        .order("is_primary", { ascending: false })
        .order("name", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error("locations load failed", error);
        setLocations([]);
        setCurrentLocationId(null);
        return;
      }
      const locs = (data ?? []) as LocationLite[];
      setLocations(locs);
      const stored = localStorage.getItem(`${LOC_STORAGE_KEY}:${currentOrgId}`);
      const initial =
        stored && locs.some((l) => l.id === stored)
          ? stored
          : (locs.find((l) => l.is_primary)?.id ?? locs[0]?.id ?? null);
      setCurrentLocationId(initial);
      if (initial) localStorage.setItem(`${LOC_STORAGE_KEY}:${currentOrgId}`, initial);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentOrgId]);

  const setCurrentLocation = useCallback(
    (locationId: string) => {
      if (!locations.some((l) => l.id === locationId)) return;
      setCurrentLocationId(locationId);
      if (currentOrgId) {
        localStorage.setItem(`${LOC_STORAGE_KEY}:${currentOrgId}`, locationId);
      }
    },
    [locations, currentOrgId],
  );

  const value = useMemo<OrgContextValue>(() => {
    const current = orgs.find((m) => m.org_id === currentOrgId) ?? null;
    const currentLocation = locations.find((l) => l.id === currentLocationId) ?? null;
    return {
      orgs,
      currentOrg: current?.organization ?? null,
      currentRole: current?.role ?? null,
      currentOrgFull,
      locations,
      currentLocation,
      setCurrentLocation,
      loading,
      switchOrg,
      refetchOrg,
    };
  }, [orgs, currentOrgId, loading, switchOrg, currentOrgFull, refetchOrg, locations, currentLocationId, setCurrentLocation]);

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
