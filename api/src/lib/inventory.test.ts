import { describe, expect, it } from "vitest";
import { canReserveSeats, isSeatInventoryType, seatsUpdateFilter } from "./inventory.js";

describe("inventory", () => {
  it("canReserveSeats requires enough seats", () => {
    expect(canReserveSeats(10, 2)).toBe(true);
    expect(canReserveSeats(2, 2)).toBe(true);
    expect(canReserveSeats(1, 2)).toBe(false);
    expect(canReserveSeats(5, 0)).toBe(false);
  });

  it("isSeatInventoryType covers transport, flight, hotel", () => {
    expect(isSeatInventoryType("transport")).toBe(true);
    expect(isSeatInventoryType("flight")).toBe(true);
    expect(isSeatInventoryType("hotel")).toBe(true);
    expect(isSeatInventoryType("tour")).toBe(false);
  });

  it("seatsUpdateFilter uses gte guests", () => {
    expect(seatsUpdateFilter(3)).toEqual({ seatsLeft: { gte: 3 } });
  });
});
