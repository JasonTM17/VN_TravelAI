import { describe, it, expect } from "vitest";
import { validateNewPassword, validatePasswordChange } from "./password-policy.js";

describe("validateNewPassword", () => {
  it("accepts length 8–128", () => {
    expect(validateNewPassword("password1").ok).toBe(true);
    expect(validateNewPassword("short").ok).toBe(false);
  });
});

describe("validatePasswordChange", () => {
  it("requires current and different new password", () => {
    expect(
      validatePasswordChange({ currentPassword: "oldpass12", newPassword: "newpass99" }).ok,
    ).toBe(true);
    expect(validatePasswordChange({ currentPassword: "", newPassword: "newpass99" }).ok).toBe(false);
    expect(
      validatePasswordChange({ currentPassword: "samepass1", newPassword: "samepass1" }).ok,
    ).toBe(false);
    expect(
      validatePasswordChange({ currentPassword: "oldpass12", newPassword: "short" }).ok,
    ).toBe(false);
  });
});
