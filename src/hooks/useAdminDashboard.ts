/**
 * Thin wrapper around the admin-dashboard edge function.
 * All calls automatically attach the user's JWT.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function callAdmin<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>("admin-dashboard", {
    body,
  });
  if (error) throw error;
  return data as T;
}

// ---- Types ----------------------------------------------------------------

export interface AdminOverview {
  totalOrgs: number;
  activeSubscriptions: number;
  newOrgsThisMonth: number;
  overdueInvoices: number;
  mrrCents: number;
  recentOrgs: RecentOrg[];
}

export interface RecentOrg {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  subscription_status: string | null;
  setup_fee_paid: boolean;
}

export interface AdminClient {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  subscription_status: string | null;
  setup_fee_paid: boolean;
  setup_fee_paid_at: string | null;
  subscriptions: {
    status: string;
    price_cents: number;
    billing_cycle: string;
    current_period_end: string | null;
    plans: { name: string } | null;
  } | null;
  org_members: { count: number }[];
}

export interface AdminClientsResponse {
  clients: AdminClient[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminClientDetail {
  org: Record<string, unknown>;
  subscription: Record<string, unknown> | null;
  invoices: AdminInvoice[];
  members: AdminMember[];
  employeeCount: number;
  saleCount: number;
}

export interface AdminMember {
  user_id: string;
  role: string;
  created_at: string;
  email: string | null;
}

export interface AdminInvoice {
  id: string;
  created_at: string;
  description: string | null;
  kind: string;
  amount_cents: number;
  status: string;
  hosted_invoice_url: string | null;
  invoice_pdf_url: string | null;
  org_id?: string;
  organizations?: { name: string } | null;
}

export interface AdminInvoicesResponse {
  invoices: AdminInvoice[];
  total: number;
  page: number;
  pageSize: number;
}

// ---- Hooks ----------------------------------------------------------------

export function useAdminOverview() {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => callAdmin<AdminOverview>({ action: "overview" }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useAdminClients(page = 0, limit = 50) {
  return useQuery({
    queryKey: ["admin", "clients", page, limit],
    queryFn: () => callAdmin<AdminClientsResponse>({ action: "clients", page, limit }),
    staleTime: 30_000,
  });
}

export function useAdminClientDetail(orgId: string | null) {
  return useQuery({
    queryKey: ["admin", "client", orgId],
    enabled: !!orgId,
    queryFn: () => callAdmin<AdminClientDetail>({ action: "client_detail", org_id: orgId }),
    staleTime: 30_000,
  });
}

export function useAdminInvoices(page = 0, limit = 50) {
  return useQuery({
    queryKey: ["admin", "invoices", page, limit],
    queryFn: () => callAdmin<AdminInvoicesResponse>({ action: "invoices", page, limit }),
    staleTime: 30_000,
  });
}
