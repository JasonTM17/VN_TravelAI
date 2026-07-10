/**
 * Seat-style inventory helpers (transport / flight).
 * Hotel/tour stay unconstrained (no room calendar — YAGNI).
 */

export type SeatInventoryItemType = "transport" | "flight" | "hotel";

export function isSeatInventoryType(itemType: string): itemType is SeatInventoryItemType {
  return itemType === "transport" || itemType === "flight" || itemType === "hotel";
}

/** Hotel uses roomsLeft; flight/transport use seatsLeft — same reserve semantics. */
export function canReserveRooms(roomsLeft: number, units: number): boolean {
  return canReserveSeats(roomsLeft, units);
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
