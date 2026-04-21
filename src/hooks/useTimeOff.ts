import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type TimeOffRequest = Tables<"time_off_requests">;
export type TimeOffWithEmployee = TimeOffRequest & {
  employees: {
    first_name: string;
    last_name: string;
    display_name: string | null;
    positions: { name: string; color: string | null } | null;
  } | null;
};

export function useMyTimeOff(employeeId: string | null | undefined) {
  return useQuery({
    queryKey: ["my_time_off", employeeId],
    enabled: !!employeeId,
    queryFn: async (): Promise<TimeOffRequest[]> => {
      const { data, error } = await supabase
        .from("time_off_requests")
        .select("*")
        .eq("employee_id", employeeId!)
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TimeOffRequest[];
    },
  });
}

export function usePendingTimeOff(orgId: string | null | undefined) {
  return useQuery({
    queryKey: ["pending_time_off", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<TimeOffWithEmployee[]> => {
      const { data, error } = await supabase
        .from("time_off_requests")
        .select("*, employees(first_name, last_name, display_name, positions(name, color))")
        .eq("org_id", orgId!)
        .eq("status", "pending")
        .order("requested_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as TimeOffWithEmployee[];
    },
  });
}

export function useTimeOffHistory(
  orgId: string | null | undefined,
  status: "approved" | "rejected" | "cancelled" | "all",
) {
  return useQuery({
    queryKey: ["time_off_history", orgId, status],
    enabled: !!orgId,
    queryFn: async (): Promise<TimeOffWithEmployee[]> => {
      let q = supabase
        .from("time_off_requests")
        .select("*, employees(first_name, last_name, display_name, positions(name, color))")
        .eq("org_id", orgId!)
        .order("decided_at", { ascending: false, nullsFirst: false })
        .order("requested_at", { ascending: false })
        .limit(200);
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as TimeOffWithEmployee[];
    },
  });
}
