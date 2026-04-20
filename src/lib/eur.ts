/**
 * EUR helpers for forms that edit prices using the Dutch comma format.
 * Storage is always integer cents.
 */

export function centsToInput(cents: number | null | undefined): string {
  const v = typeof cents === "number" ? cents : 0;
  return (v / 100).toFixed(2).replace(".", ",");
}

export function inputToCents(input: string): number {
  if (!input) return 0;
  const normalized = input.replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(normalized);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function formatPriceCents(cents: number | null | undefined): string {
  const v = typeof cents === "number" ? cents : 0;
  return `€ ${(v / 100).toFixed(2).replace(".", ",")}`;
}

export function formatPriceDelta(cents: number | null | undefined): string {
  if (!cents) return "gratis";
  const sign = cents > 0 ? "+ " : "− ";
  return `${sign}€ ${(Math.abs(cents) / 100).toFixed(2).replace(".", ",")}`;
}
