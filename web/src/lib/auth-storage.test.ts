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

describe("auth-storage", () => {
  beforeEach(() => {
    sessionMem.clear();
    localMem.clear();
    (globalThis as unknown as { window: unknown }).window = globalThis;
    (globalThis as unknown as { sessionStorage: Storage }).sessionStorage = makeStorage(sessionMem);
    (globalThis as unknown as { localStorage: Storage }).localStorage = makeStorage(localMem);
  });

  afterEach(() => {
    clearSession();
  });

  it("saves access in sessionStorage and does not store refresh", () => {
    saveSession("access-1", "refresh-should-not-persist");
    expect(getAccessToken()).toBe("access-1");
    expect(getRefreshToken()).toBeNull();
    expect(sessionMem.get("travelai_access")).toBe("access-1");
    expect(localMem.has("travelai_refresh")).toBe(false);
    expect(localMem.has("travelai_access")).toBe(false);
  });

  it("clearSession removes access from session and legacy local keys", () => {
    localMem.set("travelai_access", "old");
    localMem.set("travelai_refresh", "old-r");
    saveSession("a", "r");
    clearSession();
    expect(getAccessToken()).toBeNull();
    expect(localMem.has("travelai_access")).toBe(false);
    expect(localMem.has("travelai_refresh")).toBe(false);
  });

  it("migrates legacy localStorage access into sessionStorage", () => {
    localMem.set("travelai_access", "legacy-access");
    localMem.set("travelai_refresh", "legacy-refresh");
    expect(getAccessToken()).toBe("legacy-access");
    expect(sessionMem.get("travelai_access")).toBe("legacy-access");
    expect(localMem.has("travelai_refresh")).toBe(false);
  });
});
