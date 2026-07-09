/**
 * Contract-aware helpers — types generated from docs/openapi.yaml
 * via `pnpm generate:api` (openapi-typescript).
 *
 * Runtime calls stay in `./api.ts`; this module re-exports schema types
 * so FE stays coupled to the canonical OpenAPI contract.
 */
import type { components } from "@/generated/openapi";

export type ContractDestination = components["schemas"]["Destination"];
export type ContractHotel = components["schemas"]["Hotel"];
export type ContractTour = components["schemas"]["Tour"];
export type ContractFlight = components["schemas"]["Flight"];
export type ContractTransport = components["schemas"]["Transport"];
export type ContractBooking = components["schemas"]["Booking"];
export type ContractUser = components["schemas"]["User"];
export type ContractItinerary = components["schemas"]["Itinerary"];

/** Compile-time guard: hand-written api shapes must remain assignable to contract */
export type AssertHotelAssignable = ContractHotel;
export type AssertBookingAssignable = ContractBooking;
