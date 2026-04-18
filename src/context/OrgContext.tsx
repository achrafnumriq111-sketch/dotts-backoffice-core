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
import type { Database } from "@/integrations/supabase/types";

const STORAGE_KEY = "dotts.currentOrgId";
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

interface OrgContextValue {
  orgs: OrgMembership[];
  currentOrg: OrgMembership["organization"] | null;
  currentRole: OrgRole | null;
  loading: boolean;
  switchOrg: (orgId: string) => void;
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [orgs, setOrgs] = useState<OrgMembership[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      const { data, error } = await supabase
        .from("org_members")
        .select("role, org_id, organizations(id, name, slug)")
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("Failed to load orgs", error);
        toast.error("Er ging iets mis bij het laden");
        setLoading(false);
        return;
      }

      const memberships: OrgMembership[] = (data ?? [])
        .filter((row) => row.organizations !== null)
        .map((row) => ({
          org_id: row.org_id,
          role: row.role,
          organization: row.organizations as OrgMembership["organization"],
        }));

      if (memberships.length === 0) {
        window.location.href = `${AUTH_BASE_URL}/login`;
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

  const value = useMemo<OrgContextValue>(() => {
    const current = orgs.find((m) => m.org_id === currentOrgId) ?? null;
    return {
      orgs,
      currentOrg: current?.organization ?? null,
      currentRole: current?.role ?? null,
      loading,
      switchOrg,
    };
  }, [orgs, currentOrgId, loading, switchOrg]);

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
