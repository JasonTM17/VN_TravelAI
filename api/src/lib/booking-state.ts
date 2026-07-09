export type BookingStatus = "draft" | "pending_payment" | "confirmed" | "cancelled";

const transitions: Record<BookingStatus, BookingStatus[]> = {
  draft: ["pending_payment", "cancelled"],
  pending_payment: ["confirmed", "cancelled"],
  confirmed: ["cancelled"],
  cancelled: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return transitions[from]?.includes(to) ?? false;
}

export function applyPayment(
  status: BookingStatus,
  outcome: "success" | "fail",
): { ok: true; status: BookingStatus } | { ok: false; reason: string; status: BookingStatus } {
  if (status === "confirmed") {
    return { ok: true, status: "confirmed" };
  }
  if (status === "cancelled") {
    return { ok: false, reason: "Booking cancelled", status };
  }
  if (status !== "pending_payment" && status !== "draft") {
    return { ok: false, reason: "Invalid state", status };
  }
  if (outcome === "fail") {
    // Stay pending_payment / draft — not confirmed
    return { ok: false, reason: "Payment failed", status: status === "draft" ? "draft" : "pending_payment" };
  }
  if (!canTransition(status === "draft" ? "pending_payment" : status, "confirmed") && status !== "pending_payment") {
    // draft must go pending first conceptually; pay path treats draft as payable pending
  }
  const from: BookingStatus = status === "draft" ? "pending_payment" : status;
  if (!canTransition(from, "confirmed") && status !== "pending_payment" && status !== "draft") {
    return { ok: false, reason: "Cannot confirm from current state", status };
  }
  return { ok: true, status: "confirmed" };
}

export function resolveIdempotentCreate<T extends { id: string }>(
  existing: T | null,
  create: () => T,
): { booking: T; created: boolean } {
  if (existing) {
    return { booking: existing, created: false };
  }
  return { booking: create(), created: true };
}
