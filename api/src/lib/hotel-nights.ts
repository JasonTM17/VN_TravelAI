/** Enumerate stay nights [start, end) as UTC date-only strings YYYY-MM-DD. */

export function enumerateStayNights(startDate: Date | string, endDate: Date | string | null | undefined): string[] {
  const start = new Date(startDate);
  let end = endDate ? new Date(endDate) : new Date(start);
  if (!endDate || end <= start) {
    // single night default
    end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
  }
  const nights: string[] = [];
  const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endUtc = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (cur < endUtc) {
    nights.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
    if (nights.length > 60) break; // safety
  }
  if (nights.length === 0) {
    nights.push(new Date(start).toISOString().slice(0, 10));
  }
  return nights;
}
