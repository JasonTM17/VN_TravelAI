import { describe, expect, it } from "vitest";
import { fingerprintBookingRequest, idempotencyRequestMatches } from "./booking-idempotency";

describe("booking idempotency", () => {
  it("produces the same fingerprint regardless of object key order", () => {
    expect(fingerprintBookingRequest({ itemId: "1", quantity: 2, itemType: "hotel" })).toBe(
      fingerprintBookingRequest({ quantity: 2, itemType: "hotel", itemId: "1" }),
    );
  });

  it("changes the fingerprint when request semantics change", () => {
    expect(fingerprintBookingRequest({ itemId: "1", quantity: 1 })).not.toBe(
      fingerprintBookingRequest({ itemId: "1", quantity: 2 }),
    );
  });

  it("accepts legacy rows without a fingerprint but rejects mismatches", () => {
    expect(idempotencyRequestMatches(null, "new")).toBe(true);
    expect(idempotencyRequestMatches("same", "same")).toBe(true);
    expect(idempotencyRequestMatches("old", "new")).toBe(false);
  });
});
