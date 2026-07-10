/**
 * Access token storage.
 * Default: in-memory only (mitigates XSS reading sessionStorage).
 * Optional: NEXT_PUBLIC_PERSIST_ACCESS=true writes sessionStorage for tab reloads without waiting refresh.
 * Refresh token is httpOnly cookie on identity origin only.
 */

const ACCESS = "travelai_access";
const LEGACY_REFRESH = "travelai_refresh";

let accessMem: string | null = null;

function persistAccessEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PERSIST_ACCESS === "true" || process.env.NEXT_PUBLIC_PERSIST_ACCESS === "1";
}

function accessStore(): Storage | null {
  if (typeof window === "undefined") return null;
  if (!persistAccessEnabled()) return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function legacyLocal(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Persist access token. Second arg ignored (refresh is httpOnly cookie). */
export function saveSession(accessToken: string, refreshToken?: string) {
  void refreshToken;
  accessMem = accessToken;
  const ss = accessStore();
  if (ss) ss.setItem(ACCESS, accessToken);
  const ls = legacyLocal();
  ls?.removeItem(LEGACY_REFRESH);
  ls?.removeItem(ACCESS);
  if (!persistAccessEnabled()) {
    try {
      window.sessionStorage?.removeItem(ACCESS);
    } catch {
      /* ignore */
    }
  }
}

export function clearSession() {
  accessMem = null;
  try {
    window.sessionStorage?.removeItem(ACCESS);
  } catch {
    /* ignore */
  }
  const ls = legacyLocal();
  ls?.removeItem(ACCESS);
  ls?.removeItem(LEGACY_REFRESH);
}

export function getAccessToken(): string | null {
  if (accessMem) return accessMem;
  if (typeof window === "undefined") return null;
  if (persistAccessEnabled()) {
    try {
      const v = window.sessionStorage.getItem(ACCESS);
      if (v) {
        accessMem = v;
        return v;
      }
    } catch {
      /* ignore */
    }
  }
  // Migrate legacy localStorage once
  const ls = legacyLocal();
  const legacy = ls?.getItem(ACCESS) ?? null;
  if (legacy) {
    accessMem = legacy;
    ls?.removeItem(ACCESS);
    ls?.removeItem(LEGACY_REFRESH);
    return legacy;
  }
  return null;
}

/**
 * @deprecated Refresh is httpOnly cookie-only.
 */
export function getRefreshToken(): string | null {
  legacyLocal()?.removeItem(LEGACY_REFRESH);
  return null;
}
