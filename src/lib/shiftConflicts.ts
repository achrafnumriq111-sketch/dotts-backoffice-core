import { isoDow, toIsoDate } from "./dateNl";
import type { Tables } from "@/integrations/supabase/types";

export type Conflict = "none" | "soft" | "hard";

export interface ShiftLike {
  starts_at: string;
  ends_at: string;
}

export interface EmployeeContext {
  patterns: Pick<Tables<"availability_patterns">, "day_of_week" | "start_time" | "end_time" | "is_available">[];
  exceptions: Pick<Tables<"availability_exceptions">, "on_date" | "start_time" | "end_time" | "is_available">[];
  timeOff: Pick<Tables<"time_off_requests">, "start_date" | "end_date" | "status">[];
}

function timeStrToMin(t: string): number {
  const [h, m] = t.split(":");
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

function shiftMinutes(shift: ShiftLike): { date: string; startMin: number; endMin: number; dow: number } {
  const s = new Date(shift.starts_at);
  const e = new Date(shift.ends_at);
  const startMin = s.getHours() * 60 + s.getMinutes();
  const endMin = e.getHours() * 60 + e.getMinutes();
  return { date: toIsoDate(s), startMin, endMin: endMin === 0 ? 24 * 60 : endMin, dow: isoDow(s) };
}

/** Returns 'hard' when overlapping approved time-off, 'soft' when outside availability, else 'none'. */
export function detectConflict(shift: ShiftLike, ctx: EmployeeContext | null | undefined): Conflict {
  if (!ctx) return "none";
  const { date, startMin, endMin, dow } = shiftMinutes(shift);

  // Hard: approved time-off overlapping the date
  const onLeave = ctx.timeOff.some(
    (t) => t.status === "approved" && t.start_date <= date && t.end_date >= date,
  );
  if (onLeave) return "hard";

  // Exceptions take priority over the pattern for that date
  const exceptionsForDate = ctx.exceptions.filter((e) => e.on_date === date);
  if (exceptionsForDate.length > 0) {
    const unavailable = exceptionsForDate.find((e) => !e.is_available);
    if (unavailable) return "soft";
    const fits = exceptionsForDate.some((e) => {
      if (!e.is_available || !e.start_time || !e.end_time) return false;
      const s = timeStrToMin(e.start_time);
      const en = timeStrToMin(e.end_time);
      return s <= startMin && en >= endMin;
    });
    return fits ? "none" : "soft";
  }

  // Otherwise check standard pattern
  const blocks = ctx.patterns.filter((p) => p.day_of_week === dow && p.is_available);
  if (blocks.length === 0) return "soft";
  const fits = blocks.some((b) => {
    const s = timeStrToMin(b.start_time);
    const en = timeStrToMin(b.end_time);
    return s <= startMin && en >= endMin;
  });
  return fits ? "none" : "soft";
}