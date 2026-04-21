import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMyEmployeeId(orgId: string | null | undefined) {
  return useQuery({
    queryKey: ["my_employee_id", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase.rpc("my_employee_id", { p_org_id: orgId! });
      if (error) return null;
      return (data as string | null) ?? null;
    },
  });
}
