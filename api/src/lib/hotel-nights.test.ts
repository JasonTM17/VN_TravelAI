import { describe, expect, it } from "vitest";
import { enumerateStayNights } from "./hotel-nights.js";

describe("enumerateStayNights", () => {
  it("lists nights between start and end exclusive end", () => {
    expect(enumerateStayNights("2026-08-01", "2026-08-04")).toEqual([
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
    ]);
  });

  it("defaults to one night when end missing", () => {
    expect(enumerateStayNights("2026-08-01", null)).toEqual(["2026-08-01"]);
  });
});
