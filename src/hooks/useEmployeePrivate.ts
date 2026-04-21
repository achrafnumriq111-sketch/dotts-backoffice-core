import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useTeamPermissions } from "./useTeamPermissions";

export type EmployeePrivate = Tables<"employee_private">;

export function useEmployeePrivate(employeeId: string | undefined) {
  const { canSeeFinancial } = useTeamPermissions();
  return useQuery({
    queryKey: ["employee_private", employeeId],
    enabled: !!employeeId && canSeeFinancial,
    queryFn: async (): Promise<EmployeePrivate | null> => {
      const { data, error } = await supabase
        .from("employee_private")
        .select("*")
        .eq("employee_id", employeeId!)
        .maybeSingle();
      if (error) {
        // RLS denial → return null silently
        return null;
      }
      return data as EmployeePrivate | null;
    },
  });
}

export function useSensitiveLog(employeeId: string | undefined) {
  const { canSeeFinancial } = useTeamPermissions();
  return useQuery({
    queryKey: ["sensitive_log", employeeId],
    enabled: !!employeeId && canSeeFinancial,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sensitive_data_access_log")
        .select("*")
        .eq("employee_id", employeeId!)
        .order("at", { ascending: false })
        .limit(20);
      if (error) return [];
      return data ?? [];
    },
  });
}