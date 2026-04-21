import { addDays, format, getISOWeek, startOfISOWeek } from "date-fns";
import { nl } from "date-fns/locale";

export const DAY_LABELS_SHORT = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
export const DAY_LABELS_LONG = [
  "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag",
];

/** ISO day-of-week 1-7 (Mon=1) */
export function isoDow(date: Date): number {
  const js = date.getDay();
  return js === 0 ? 7 : js;
}

export function weekStart(date: Date): Date {
  return startOfISOWeek(date);
}

export function weekDates(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatWeekLabel(start: Date): string {
  const end = addDays(start, 6);
  const w = getISOWeek(start);
  return `Week ${w} · ${format(start, "d MMM", { locale: nl })} – ${format(end, "d MMM", { locale: nl })}`;
}

export function formatRangeNL(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  return `${format(s, "EEE d MMM", { locale: nl })} – ${format(e, "EEE d MMM yyyy", { locale: nl })}`;
}

export function dayCount(startIso: string, endIso: string): number {
  const s = new Date(startIso).getTime();
  const e = new Date(endIso).getTime();
  return Math.round((e - s) / 86400000) + 1;
}

/** "HH:MM:SS" -> "HH:MM" */
export function trimTime(t: string | null | undefined): string {
  if (!t) return "";
  return t.slice(0, 5);
}
