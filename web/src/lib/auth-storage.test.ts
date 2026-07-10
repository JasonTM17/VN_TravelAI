import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearSession, getAccessToken, getRefreshToken, saveSession } from "./auth-storage";

const mem = new Map<string, string>();

describe("auth-storage", () => {
  beforeEach(() => {
    mem.clear();
    // jsdom-free stub: module checks typeof window
    (globalThis as unknown as { window: unknown }).window = globalThis;
    (globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, String(v));
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
      clear: () => mem.clear(),
      key: () => null,
      length: 0,
    };
  });

  afterEach(() => {
    clearSession();
  });

  it("saves and reads access + refresh tokens", () => {
    saveSession("access-1", "refresh-1");
    expect(getAccessToken()).toBe("access-1");
    expect(getRefreshToken()).toBe("refresh-1");
  });

  it("clearSession removes both keys", () => {
    saveSession("a", "r");
    clearSession();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
