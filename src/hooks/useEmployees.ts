import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Position = Tables<"positions">;
export type Employee = Tables<"employees"> & {
  positions: Pick<Position, "id" | "name" | "color"> | null;
};

export function useEmployees(orgId: string | null | undefined) {
  return useQuery({
    queryKey: ["employees", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from("employees")
        .select("*, positions(id, name, color)")
        .eq("org_id", orgId!)
        .order("first_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Employee[];
    },
  });
}

export function useEmployee(employeeId: string | undefined) {
  return useQuery({
    queryKey: ["employee", employeeId],
    enabled: !!employeeId,
    queryFn: async (): Promise<Employee | null> => {
      const { data, error } = await supabase
        .from("employees")
        .select("*, positions(id, name, color)")
        .eq("id", employeeId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Employee | null;
    },
  });
}