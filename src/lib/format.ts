/**
 * Deterministic date formatting for client components. Intl output differs between
 * Node and browsers (ICU versions), which causes hydration mismatches, so we format by hand.
 */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Sun 27 Sep" (UTC-based so server and client agree). */
export function shortDate(d: Date): string {
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "Sun 14:05 UTC" */
export function dayTime(d: Date): string {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${DAYS[d.getUTCDay()]} ${hh}:${mm} UTC`;
}
