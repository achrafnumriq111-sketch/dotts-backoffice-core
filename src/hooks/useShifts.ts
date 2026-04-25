import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { addDays, toIsoDate } from "@/lib/dateNlHelpers";

export type ShiftRow = Tables<"shifts"> & {
  positions: { id: string; name: string; color: string | null } | null;
  shift_assignments: { id: string; employee_id: string }[];
};

export function useShiftsWeek(
  orgId: string | null | undefined,
  locationId: string | null | undefined,
  weekStart: Date,
) {
  const startIso = toIsoDate(weekStart);
  const endIso = toIsoDate(addDays(weekStart, 7));
  return useQuery({
    queryKey: ["shifts-week", orgId, locationId, startIso],
    enabled: !!orgId && !!locationId,
    queryFn: async () => {
      const [shiftsRes, patRes, excRes, toRes] = await Promise.all([
        supabase
          .from("shifts")
          .select("*, positions(id,name,color), shift_assignments(id, employee_id)")
          .eq("location_id", locationId!)
          .gte("starts_at", `${startIso}T00:00:00`)
          .lt("starts_at", `${endIso}T00:00:00`)
          .order("starts_at", { ascending: true }),
        supabase
          .from("availability_patterns")
          .select("employee_id, day_of_week, start_time, end_time, is_available")
          .eq("org_id", orgId!),
        supabase
          .from("availability_exceptions")
          .select("employee_id, on_date, start_time, end_time, is_available")
          .eq("org_id", orgId!)
          .gte("on_date", startIso)
          .lt("on_date", endIso),
        supabase
          .from("time_off_requests")
          .select("employee_id, start_date, end_date, status")
          .eq("org_id", orgId!)
          .eq("status", "approved")
          .lte("start_date", endIso)
          .gte("end_date", startIso),
      ]);
      if (shiftsRes.error) throw shiftsRes.error;
      if (patRes.error) throw patRes.error;
      if (excRes.error) throw excRes.error;
      if (toRes.error) throw toRes.error;
      return {
        shifts: (shiftsRes.data ?? []) as unknown as ShiftRow[],
        patterns: patRes.data ?? [],
        exceptions: excRes.data ?? [],
        timeOff: toRes.data ?? [],
      };
    },
  });
}

export type MyShiftRow = {
  id: string;
  shift: {
    id: string;
    starts_at: string;
    ends_at: string;
    break_minutes: number;
    notes: string | null;
    status: string;
    location_id: string;
    positions: { name: string; color: string | null } | null;
    locations: { name: string } | null;
  } | null;
};

export function useMyShifts(
  myEmployeeId: string | null | undefined,
  weekStart: Date,
  mode: "week" | "upcoming",
) {
  const startIso = toIsoDate(weekStart);
  const endIso = toIsoDate(addDays(weekStart, 7));
  return useQuery({
    queryKey: ["my-shifts", myEmployeeId, mode, startIso],
    enabled: !!myEmployeeId,
    queryFn: async (): Promise<MyShiftRow[]> => {
      let q = supabase
        .from("shift_assignments")
        .select(
          "id, shift:shifts!inner(id, starts_at, ends_at, break_minutes, notes, status, location_id, positions(name,color), locations(name))",
        )
        .eq("employee_id", myEmployeeId!)
        .eq("shift.status", "published");

      if (mode === "week") {
        q = q.gte("shift.starts_at", `${startIso}T00:00:00`).lt("shift.starts_at", `${endIso}T00:00:00`);
      } else {
        const today = toIsoDate(new Date());
        q = q.gte("shift.starts_at", `${today}T00:00:00`);
      }

      const { data, error } = await q.order("starts_at", { ascending: true, referencedTable: "shifts" });
      if (error) throw error;
      return ((data ?? []) as unknown as MyShiftRow[]).filter((r) => r.shift !== null);
    },
  });
}

export function useDraftShiftsCount(orgId: string | null | undefined) {
  return useQuery({
    queryKey: ["shifts-draft-count", orgId],
    enabled: !!orgId,
    refetchInterval: 60_000,
    queryFn: async (): Promise<number> => {
      const now = new Date();
      const in14 = addDays(now, 14);
      const { count, error } = await supabase
        .from("shifts")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId!)
        .eq("status", "draft")
        .gte("starts_at", now.toISOString())
        .lt("starts_at", in14.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
  });
}