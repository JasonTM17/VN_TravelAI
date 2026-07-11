/** Format a Date as a calendar date in the user's local timezone. */
export function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function localDateDaysFromNow(days: number, now = new Date()): string {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return toLocalDateInputValue(date);
}
