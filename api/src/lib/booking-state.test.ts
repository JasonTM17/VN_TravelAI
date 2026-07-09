import { describe, it, expect } from "vitest";
import { applyPayment, canTransition, resolveIdempotentCreate } from "./booking-state.js";

describe("booking-state machine (shipped module)", () => {
  it("allows pending_payment → confirmed and draft → pending_payment", () => {
    expect(canTransition("pending_payment", "confirmed")).toBe(true);
    expect(canTransition("draft", "pending_payment")).toBe(true);
    expect(canTransition("confirmed", "pending_payment")).toBe(false);
  });

  it("mock pay success confirms booking", () => {
    const result = applyPayment("pending_payment", "success");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.status).toBe("confirmed");
  });

  it("mock pay fail does not confirm booking", () => {
    const result = applyPayment("pending_payment", "fail");
    expect(result.ok).toBe(false);
    expect(result.status).not.toBe("confirmed");
    expect(result.status).toBe("pending_payment");
  });

  it("cancelled booking cannot be paid to confirmed", () => {
    const result = applyPayment("cancelled", "success");
    expect(result.ok).toBe(false);
    expect(result.status).toBe("cancelled");
  });

  it("idempotency key returns same booking without second create", () => {
    const first = { id: "b1" };
    const r1 = resolveIdempotentCreate(null, () => first);
    expect(r1.created).toBe(true);
    const r2 = resolveIdempotentCreate(first, () => ({ id: "b2" }));
    expect(r2.created).toBe(false);
    expect(r2.booking.id).toBe("b1");
  });
});
