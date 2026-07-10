/**
 * Lightweight PMS helpers: pick room type / rate plan for hotel bookings.
 */

export type RoomTypeLike = {
  id: string;
  code: string;
  nameEn: string;
  nameVi: string;
  maxOccupancy: number;
  roomsTotal: number;
  basePriceVnd: number;
  ratePlans: Array<{
    id: string;
    code: string;
    nameEn: string;
    nameVi: string;
    priceVnd: number;
    breakfastIncluded: boolean;
    refundable: boolean;
  }>;
};

export function pickRoomType(
  roomTypes: RoomTypeLike[],
  roomTypeId?: string | null,
): RoomTypeLike | null {
  if (!roomTypes.length) return null;
  if (roomTypeId) {
    return roomTypes.find((r) => r.id === roomTypeId) ?? null;
  }
  // Prefer STD code, else cheapest base price
  const std = roomTypes.find((r) => r.code === "STD");
  if (std) return std;
  return [...roomTypes].sort((a, b) => a.basePriceVnd - b.basePriceVnd)[0] ?? null;
}

export function pickRatePlan(
  roomType: RoomTypeLike,
  ratePlanId?: string | null,
): RoomTypeLike["ratePlans"][number] | null {
  const plans = roomType.ratePlans;
  if (!plans.length) return null;
  if (ratePlanId) {
    return plans.find((p) => p.id === ratePlanId) ?? null;
  }
  const bar = plans.find((p) => p.code === "BAR");
  if (bar) return bar;
  return [...plans].sort((a, b) => a.priceVnd - b.priceVnd)[0] ?? null;
}

/** Nightly unit price: rate plan price, else room type base. */
export function nightlyPriceVnd(
  roomType: RoomTypeLike,
  ratePlan: RoomTypeLike["ratePlans"][number] | null,
): number {
  if (ratePlan) return ratePlan.priceVnd;
  return roomType.basePriceVnd;
}
