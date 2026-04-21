import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Position = Tables<"positions">;

export function usePositions(orgId: string | null | undefined) {
  return useQuery({
    queryKey: ["positions", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<Position[]> => {
      const { data, error } = await supabase
        .from("positions")
        .select("*")
        .eq("org_id", orgId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Position[];
    },
  });
}