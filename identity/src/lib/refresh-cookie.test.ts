import { describe, expect, it } from "vitest";
import {
  REFRESH_COOKIE_NAME,
  buildRefreshClearCookie,
  buildRefreshSetCookie,
  parseRefreshCookie,
  resolveRefreshToken,
} from "./refresh-cookie.js";

describe("refresh-cookie", () => {
  it("builds httpOnly Set-Cookie with Max-Age and SameSite=Lax", () => {
    const c = buildRefreshSetCookie("opaque-refresh-token-value", {
      maxAgeSec: 3600,
      secure: false,
    });
    expect(c).toContain(`${REFRESH_COOKIE_NAME}=`);
    expect(c).toContain("HttpOnly");
    expect(c).toContain("SameSite=Lax");
    expect(c).toContain("Max-Age=3600");
    expect(c).not.toContain("Secure");
  });

  it("forces Secure when SameSite=None", () => {
    const c = buildRefreshSetCookie("tok", {
      maxAgeSec: 60,
      secure: false,
      sameSite: "None",
    });
    expect(c).toContain("SameSite=None");
    expect(c).toContain("Secure");
  });

  it("parses cookie header", () => {
    const header = `a=1; ${REFRESH_COOKIE_NAME}=my-refresh-token-xyz; b=2`;
    expect(parseRefreshCookie(header)).toBe("my-refresh-token-xyz");
  });

  it("resolve prefers body over cookie", () => {
    const body = "body-refresh-token-long";
    const cookie = `${REFRESH_COOKIE_NAME}=cookie-refresh-token-long`;
    expect(resolveRefreshToken(body, cookie)).toBe(body);
    expect(resolveRefreshToken(undefined, cookie)).toBe("cookie-refresh-token-long");
    expect(resolveRefreshToken(undefined, undefined)).toBeNull();
  });

  it("clear cookie has Max-Age=0", () => {
    const c = buildRefreshClearCookie({ secure: false });
    expect(c).toContain("Max-Age=0");
    expect(c).toContain("HttpOnly");
  });

  it("includes Domain when valid multi-host domain provided", () => {
    const c = buildRefreshSetCookie("tok", {
      maxAgeSec: 60,
      secure: true,
      sameSite: "None",
      domain: ".example.com",
    });
    expect(c).toContain("Domain=.example.com");
  });

  it("skips invalid Domain values", () => {
    const c = buildRefreshSetCookie("tok", {
      maxAgeSec: 60,
      secure: false,
      domain: "evil; Drop=1",
    });
    expect(c).not.toContain("Domain=");
  });
});
