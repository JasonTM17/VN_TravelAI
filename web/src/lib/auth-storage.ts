/**
 * Access token storage only.
 * Refresh token lives in httpOnly cookie on the identity origin (credentials: include).
 */
const ACCESS = "travelai_access";
/** Legacy key — cleared on write/clear so old dual-localStorage sessions migrate. */
const LEGACY_REFRESH = "travelai_refresh";

function accessStore(): Storage | null {
  if (typeof window === "undefined") return null;
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

/** Persist access token (sessionStorage). Second arg ignored (refresh is httpOnly cookie). */
export function saveSession(accessToken: string, refreshToken?: string) {
  void refreshToken;
  const ss = accessStore();
  if (!ss) return;
  ss.setItem(ACCESS, accessToken);
  // Migrate away from localStorage refresh
  const ls = legacyLocal();
  ls?.removeItem(LEGACY_REFRESH);
  ls?.removeItem(ACCESS);
}

export function clearSession() {
  accessStore()?.removeItem(ACCESS);
  const ls = legacyLocal();
  ls?.removeItem(ACCESS);
  ls?.removeItem(LEGACY_REFRESH);
}

export function getAccessToken(): string | null {
  const ss = accessStore();
  if (ss) {
    const v = ss.getItem(ACCESS);
    if (v) return v;
  }
  // One-time read of legacy localStorage access during migration
  const ls = legacyLocal();
  const legacy = ls?.getItem(ACCESS) ?? null;
  if (legacy) {
    ss?.setItem(ACCESS, legacy);
    ls?.removeItem(ACCESS);
    ls?.removeItem(LEGACY_REFRESH);
  }
  return legacy;
}

/**
 * @deprecated Refresh is httpOnly cookie-only. Always returns null.
 * Kept so call sites compile during transition.
 */
export function getRefreshToken(): string | null {
  // Wipe any leftover localStorage refresh
  legacyLocal()?.removeItem(LEGACY_REFRESH);
  return null;
}
