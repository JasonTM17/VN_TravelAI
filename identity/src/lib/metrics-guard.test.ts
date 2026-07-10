import { describe, expect, it } from "vitest";
import { metricsAuthorized } from "./metrics-guard.js";

describe("metricsAuthorized", () => {
  it("allows all when token empty", () => {
    expect(metricsAuthorized("", undefined, undefined)).toBe(true);
    expect(metricsAuthorized(undefined, undefined, undefined)).toBe(true);
  });

  it("rejects missing or wrong token when required", () => {
    expect(metricsAuthorized("secret", undefined, undefined)).toBe(false);
    expect(metricsAuthorized("secret", "Bearer no", undefined)).toBe(false);
    expect(metricsAuthorized("secret", undefined, "nope")).toBe(false);
  });

  it("accepts Bearer or X-Metrics-Token", () => {
    expect(metricsAuthorized("secret", "Bearer secret", undefined)).toBe(true);
    expect(metricsAuthorized("secret", undefined, "secret")).toBe(true);
  });
});
