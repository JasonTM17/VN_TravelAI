import type { Prisma } from "@prisma/client";
import { enumerateStayNights } from "./hotel-nights.js";

type Tx = Prisma.TransactionClient;

export type NightInventoryScope = {
  hotelId: string;
  roomTypeId?: string | null;
  defaultRooms: number;
};

/** Ensure night rows exist then verify availability (optionally per room type). */
export async function ensureAndCheckHotelNights(
  tx: Tx,
  hotelId: string,
  startDate: Date,
  endDate: Date | null,
  defaultRooms: number,
  roomTypeId?: string | null,
): Promise<{ ok: true; nights: string[] } | { ok: false; reason: string }> {
  const nights = enumerateStayNights(startDate, endDate);
  const rt = roomTypeId ?? null;
  for (const night of nights) {
    const d = new Date(night + "T00:00:00.000Z");
    const existing = await tx.hotelNightInventory.findFirst({
      where: { hotelId, night: d, roomTypeId: rt },
    });
    if (!existing) {
      await tx.hotelNightInventory.create({
        data: {
          hotelId,
          roomTypeId: rt,
          night: d,
          roomsLeft: Math.max(0, defaultRooms),
        },
      });
    }
  }
  for (const night of nights) {
    const d = new Date(night + "T00:00:00.000Z");
    const row = await tx.hotelNightInventory.findFirst({
      where: { hotelId, night: d, roomTypeId: rt },
    });
    if (!row || row.roomsLeft < 1) {
      return { ok: false, reason: `No rooms on ${night}` };
    }
  }
  return { ok: true, nights };
}

export async function decrementHotelNights(
  tx: Tx,
  hotelId: string,
  nights: string[],
  roomTypeId?: string | null,
): Promise<boolean> {
  const rt = roomTypeId ?? null;
  for (const night of nights) {
    const d = new Date(night + "T00:00:00.000Z");
    const r = await tx.hotelNightInventory.updateMany({
      where: { hotelId, night: d, roomTypeId: rt, roomsLeft: { gte: 1 } },
      data: { roomsLeft: { decrement: 1 } },
    });
    if (r.count === 0) return false;
  }
  return true;
}

export async function incrementHotelNights(
  tx: Tx,
  hotelId: string,
  nights: string[],
  roomTypeId?: string | null,
): Promise<void> {
  const rt = roomTypeId ?? null;
  for (const night of nights) {
    const d = new Date(night + "T00:00:00.000Z");
    await tx.hotelNightInventory.updateMany({
      where: { hotelId, night: d, roomTypeId: rt },
      data: { roomsLeft: { increment: 1 } },
    });
  }
}
