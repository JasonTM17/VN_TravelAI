/**
 * Seat-style inventory helpers (transport / flight).
 * Hotel/tour stay unconstrained (no room calendar — YAGNI).
 */

export type SeatInventoryItemType = "transport" | "flight";

export function isSeatInventoryType(itemType: string): itemType is SeatInventoryItemType {
  return itemType === "transport" || itemType === "flight";
}

/** Whether guests can be reserved against remaining seats. */
export function canReserveSeats(seatsLeft: number, guests: number): boolean {
  if (!Number.isFinite(seatsLeft) || !Number.isFinite(guests)) return false;
  if (guests < 1) return false;
  return seatsLeft >= guests;
}

/**
 * Pure check for concurrent-safe updateMany filter semantics:
 * update only when seatsLeft >= guests.
 */
export function seatsUpdateFilter(guests: number): { seatsLeft: { gte: number } } {
  return { seatsLeft: { gte: Math.max(1, guests) } };
}
