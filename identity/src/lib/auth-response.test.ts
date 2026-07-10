import { describe, expect, it } from "vitest";
import { buildAuthData } from "./auth-response.js";

const user = {
  id: "u1",
  email: "a@b.co",
  fullName: "A",
  role: "user",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("buildAuthData", () => {
  it("omits refreshToken by default", () => {
    const data = buildAuthData({
      accessToken: "acc",
      expiresIn: 900,
      user,
      refreshRaw: "refresh-secret-value",
      allowBodyRefresh: false,
    });
    expect(data.accessToken).toBe("acc");
    expect(data.user).toEqual(user);
    expect(data).not.toHaveProperty("refreshToken");
  });

  it("includes refreshToken when allowBodyRefresh", () => {
    const data = buildAuthData({
      accessToken: "acc",
      expiresIn: 900,
      user,
      refreshRaw: "refresh-secret-value",
      allowBodyRefresh: true,
    });
    expect(data.refreshToken).toBe("refresh-secret-value");
  });
});
