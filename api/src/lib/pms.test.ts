import { describe, expect, it } from "vitest";
import { nightlyPriceVnd, pickRatePlan, pickRoomType } from "./pms.js";

const sample = [
  {
    id: "rt-std",
    code: "STD",
    nameEn: "Standard",
    nameVi: "TC",
    maxOccupancy: 2,
    roomsTotal: 10,
    basePriceVnd: 1_000_000,
    ratePlans: [
      {
        id: "rp-bar",
        code: "BAR",
        nameEn: "BAR",
        nameVi: "BAR",
        priceVnd: 1_000_000,
        breakfastIncluded: false,
        refundable: true,
      },
      {
        id: "rp-bb",
        code: "BB",
        nameEn: "BB",
        nameVi: "BB",
        priceVnd: 1_150_000,
        breakfastIncluded: true,
        refundable: true,
      },
    ],
  },
  {
    id: "rt-dlx",
    code: "DLX",
    nameEn: "Deluxe",
    nameVi: "DLX",
    maxOccupancy: 3,
    roomsTotal: 5,
    basePriceVnd: 1_500_000,
    ratePlans: [
      {
        id: "rp-dlx-bar",
        code: "BAR",
        nameEn: "BAR",
        nameVi: "BAR",
        priceVnd: 1_500_000,
        breakfastIncluded: false,
        refundable: true,
      },
    ],
  },
];

describe("pms pickers", () => {
  it("defaults to STD room type", () => {
    expect(pickRoomType(sample)?.id).toBe("rt-std");
  });

  it("selects explicit room type", () => {
    expect(pickRoomType(sample, "rt-dlx")?.code).toBe("DLX");
  });

  it("defaults to BAR rate plan", () => {
    const rt = pickRoomType(sample)!;
    expect(pickRatePlan(rt)?.code).toBe("BAR");
  });

  it("nightly price prefers rate plan", () => {
    const rt = pickRoomType(sample)!;
    const rp = pickRatePlan(rt, "rp-bb");
    expect(nightlyPriceVnd(rt, rp)).toBe(1_150_000);
  });
});
