import { describe, expect, it } from "vitest";
import { localDateDaysFromNow, toLocalDateInputValue } from "./local-date";

describe("local calendar dates", () => {
  it("does not shift a local date through UTC", () => {
    const date = new Date(2026, 0, 2, 0, 30);
    expect(toLocalDateInputValue(date)).toBe("2026-01-02");
  });

  it("handles month boundaries with calendar arithmetic", () => {
    expect(localDateDaysFromNow(2, new Date(2026, 0, 30, 23, 0))).toBe("2026-02-01");
  });
});
