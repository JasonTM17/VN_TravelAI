import { describe, it, expect } from "vitest";
import { isAdminRole, readJwtRole } from "./jwt-role";

function fakeJwt(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `hdr.${body}.sig`;
}

describe("readJwtRole", () => {
  it("reads role claim from JWT payload segment", () => {
    expect(readJwtRole(fakeJwt({ role: "admin", sub: "u1" }))).toBe("admin");
    expect(readJwtRole(fakeJwt({ role: "user" }))).toBe("user");
    expect(readJwtRole(null)).toBe(null);
    expect(readJwtRole("not-a-jwt")).toBe(null);
  });

  it("isAdminRole only true for admin", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("user")).toBe(false);
    expect(isAdminRole(null)).toBe(false);
  });
});
