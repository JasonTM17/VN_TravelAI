import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearSession, getAccessToken, getRefreshToken, saveSession } from "./auth-storage";

const sessionMem = new Map<string, string>();
const localMem = new Map<string, string>();

function makeStorage(map: Map<string, string>): Storage {
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => map.clear(),
    key: () => null,
    length: 0,
  };
}

describe("auth-storage memory-first", () => {
  beforeEach(() => {
    sessionMem.clear();
    localMem.clear();
    delete process.env.NEXT_PUBLIC_PERSIST_ACCESS;
    (globalThis as unknown as { window: unknown }).window = globalThis;
    (globalThis as unknown as { sessionStorage: Storage }).sessionStorage = makeStorage(sessionMem);
    (globalThis as unknown as { localStorage: Storage }).localStorage = makeStorage(localMem);
    clearSession();
  });

  afterEach(() => {
    clearSession();
    delete process.env.NEXT_PUBLIC_PERSIST_ACCESS;
  });

  it("does not retain auth state when invoked during SSR", () => {
    clearSession();
    delete (globalThis as unknown as { window?: unknown }).window;
    saveSession("server-user-token");
    expect(getAccessToken()).toBeNull();
  });

  it("default saves access only in memory, not sessionStorage", () => {
    saveSession("access-1", "refresh-ignored");
    expect(getAccessToken()).toBe("access-1");
    expect(getRefreshToken()).toBeNull();
    expect(sessionMem.has("travelai_access")).toBe(false);
    expect(localMem.has("travelai_refresh")).toBe(false);
  });

  it("clearSession wipes memory", () => {
    saveSession("a");
    clearSession();
    expect(getAccessToken()).toBeNull();
  });

  it("NEXT_PUBLIC_PERSIST_ACCESS=true uses sessionStorage", () => {
    process.env.NEXT_PUBLIC_PERSIST_ACCESS = "true";
    saveSession("persisted");
    expect(sessionMem.get("travelai_access")).toBe("persisted");
    expect(getAccessToken()).toBe("persisted");
  });
});
