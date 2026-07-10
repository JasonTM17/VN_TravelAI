import type { Prisma } from "@prisma/client";
import { enumerateStayNights } from "./hotel-nights.js";

type Tx = Prisma.TransactionClient;

/** Ensure night rows exist (seed from hotel.roomsLeft) then verify availability. */
export async function ensureAndCheckHotelNights(
  tx: Tx,
  hotelId: string,
  startDate: Date,
  endDate: Date | null,
  defaultRooms: number,
): Promise<{ ok: true; nights: string[] } | { ok: false; reason: string }> {
  const nights = enumerateStayNights(startDate, endDate);
  for (const night of nights) {
    const d = new Date(night + "T00:00:00.000Z");
    const existing = await tx.hotelNightInventory.findUnique({
      where: { hotelId_night: { hotelId, night: d } },
    });
    if (!existing) {
      await tx.hotelNightInventory.create({
        data: { hotelId, night: d, roomsLeft: Math.max(0, defaultRooms) },
      });
    }
  }
  for (const night of nights) {
    const d = new Date(night + "T00:00:00.000Z");
    const row = await tx.hotelNightInventory.findUnique({
      where: { hotelId_night: { hotelId, night: d } },
    });
    if (!row || row.roomsLeft < 1) {
      return { ok: false, reason: `No rooms on ${night}` };
    }
  }
  return { ok: true, nights };
}

export async function decrementHotelNights(tx: Tx, hotelId: string, nights: string[]): Promise<boolean> {
  for (const night of nights) {
    const d = new Date(night + "T00:00:00.000Z");
    const r = await tx.hotelNightInventory.updateMany({
      where: { hotelId, night: d, roomsLeft: { gte: 1 } },
      data: { roomsLeft: { decrement: 1 } },
    });
    if (r.count === 0) return false;
  }
  return true;
}

export async function incrementHotelNights(tx: Tx, hotelId: string, nights: string[]): Promise<void> {
  for (const night of nights) {
    const d = new Date(night + "T00:00:00.000Z");
    await tx.hotelNightInventory.updateMany({
      where: { hotelId, night: d },
      data: { roomsLeft: { increment: 1 } },
    });
  }
}
