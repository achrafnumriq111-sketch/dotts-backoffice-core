import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type AvailabilityPattern = Tables<"availability_patterns">;
export type AvailabilityException = Tables<"availability_exceptions">;
export type TimeOffRequest = Tables<"time_off_requests">;

export function useAvailabilityPatterns(employeeId: string | null | undefined) {
  return useQuery({
    queryKey: ["availability_patterns", employeeId],
    enabled: !!employeeId,
    queryFn: async (): Promise<AvailabilityPattern[]> => {
      const { data, error } = await supabase
        .from("availability_patterns")
        .select("*")
        .eq("employee_id", employeeId!)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AvailabilityPattern[];
    },
  });
}

export function useAvailabilityExceptions(
  employeeId: string | null | undefined,
  dateFrom: string,
  dateTo: string,
) {
  return useQuery({
    queryKey: ["availability_exceptions", employeeId, dateFrom, dateTo],
    enabled: !!employeeId,
    queryFn: async (): Promise<AvailabilityException[]> => {
      const { data, error } = await supabase
        .from("availability_exceptions")
        .select("*")
        .eq("employee_id", employeeId!)
        .gte("on_date", dateFrom)
        .lte("on_date", dateTo)
        .order("on_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AvailabilityException[];
    },
  });
}

export type EmployeeRowLite = {
  id: string;
  display_name: string | null;
  first_name: string;
  last_name: string;
  position_id: string | null;
  positions: { id: string; name: string; color: string | null } | null;
};

export function useTeamAvailability(
  orgId: string | null | undefined,
  weekStartIso: string,
  weekEndIso: string,
) {
  return useQuery({
    queryKey: ["team_availability", orgId, weekStartIso, weekEndIso],
    enabled: !!orgId,
    queryFn: async () => {
      const [empsRes, patRes, excRes, toRes] = await Promise.all([
        supabase
          .from("employees")
          .select("id, display_name, first_name, last_name, position_id, positions(id,name,color)")
          .eq("org_id", orgId!)
          .eq("is_active", true)
          .order("first_name", { ascending: true }),
        supabase
          .from("availability_patterns")
          .select("*")
          .eq("org_id", orgId!),
        supabase
          .from("availability_exceptions")
          .select("*")
          .eq("org_id", orgId!)
          .gte("on_date", weekStartIso)
          .lte("on_date", weekEndIso),
        supabase
          .from("time_off_requests")
          .select("*")
          .eq("org_id", orgId!)
          .eq("status", "approved")
          .lte("start_date", weekEndIso)
          .gte("end_date", weekStartIso),
      ]);
      if (empsRes.error) throw empsRes.error;
      if (patRes.error) throw patRes.error;
      if (excRes.error) throw excRes.error;
      if (toRes.error) throw toRes.error;
      return {
        employees: (empsRes.data ?? []) as unknown as EmployeeRowLite[],
        patterns: (patRes.data ?? []) as AvailabilityPattern[],
        exceptions: (excRes.data ?? []) as AvailabilityException[],
        timeOff: (toRes.data ?? []) as TimeOffRequest[],
      };
    },
  });
}
