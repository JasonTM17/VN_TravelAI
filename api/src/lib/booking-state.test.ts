import { describe, it, expect } from "vitest";

const transitions: Record<string, string[]> = {
  draft: ["pending_payment", "cancelled"],
  pending_payment: ["confirmed", "cancelled"],
  confirmed: ["cancelled"],
  cancelled: [],
};

function canTransition(from: string, to: string) {
  return transitions[from]?.includes(to) ?? false;
}

describe("booking state machine", () => {
  it("allows pending_payment to confirmed", () => {
    expect(canTransition("pending_payment", "confirmed")).toBe(true);
  });

  it("disallows confirmed to pending_payment", () => {
    expect(canTransition("confirmed", "pending_payment")).toBe(false);
  });

  it("allows cancel from open states", () => {
    expect(canTransition("draft", "cancelled")).toBe(true);
    expect(canTransition("pending_payment", "cancelled")).toBe(true);
    expect(canTransition("confirmed", "cancelled")).toBe(true);
  });
});
