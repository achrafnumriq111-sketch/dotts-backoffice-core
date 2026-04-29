import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const PERMISSION_KEYS = [
  "can_discount",
  "can_void_sale",
  "can_email_receipt",
  "can_open_cash_drawer",
  "can_close_register_session",
  "can_view_kasa_history",
  "requires_email",
] as const;

export type PermissionKey = typeof PERMISSION_KEYS[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  can_discount: "Korting geven",
  can_void_sale: "Verkoop storneren",
  can_email_receipt: "Bon mailen",
  can_open_cash_drawer: "Kassalade openen",
  can_close_register_session: "Kassa afsluiten",
  can_view_kasa_history: "Kassa-geschiedenis bekijken",
  requires_email: "E-mail bij verkoop verplicht",
};

export type PositionPermissions = Partial<Record<PermissionKey, boolean>>;

// Default to true when key absent (safe-by-default per spec).
export function getPermission(perms: PositionPermissions | null | undefined, key: PermissionKey): boolean {
  if (!perms) return true;
  const v = (perms as Record<string, unknown>)[key];
  if (v === undefined || v === null) return true;
  return Boolean(v);
}

interface ResolvedPermissions {
  loading: boolean;
  permissions: PositionPermissions | null;
  canDiscount: boolean;
  canVoidSale: boolean;
  canEmailReceipt: boolean;
  canOpenCashDrawer: boolean;
  canCloseRegister: boolean;
  canViewKasaHistory: boolean;
  requiresEmail: boolean;
}

export function usePositionPermissions(orgId: string | null | undefined): ResolvedPermissions {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["my-position-permissions", orgId, userId],
    enabled: !!orgId && !!userId,
    queryFn: async (): Promise<PositionPermissions | null> => {
      const { data, error } = await supabase
        .from("employees")
        .select("position_id, positions(permissions)")
        .eq("org_id", orgId!)
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      const perms = (data?.positions as { permissions?: PositionPermissions } | null)?.permissions;
      return (perms ?? null) as PositionPermissions | null;
    },
  });

  return {
    loading: isLoading,
    permissions: data ?? null,
    canDiscount: getPermission(data, "can_discount"),
    canVoidSale: getPermission(data, "can_void_sale"),
    canEmailReceipt: getPermission(data, "can_email_receipt"),
    canOpenCashDrawer: getPermission(data, "can_open_cash_drawer"),
    canCloseRegister: getPermission(data, "can_close_register_session"),
    canViewKasaHistory: getPermission(data, "can_view_kasa_history"),
    requiresEmail: getPermission(data, "requires_email"),
  };
}
