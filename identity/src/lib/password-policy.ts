/**
 * Shared password policy for register + change-password (pure, unit-tested).
 */
export const MIN_PASSWORD_LEN = 8;
export const MAX_PASSWORD_LEN = 128;

export function validateNewPassword(password: string): { ok: true } | { ok: false; reason: string } {
  if (typeof password !== "string") {
    return { ok: false, reason: "password must be a string" };
  }
  if (password.length < MIN_PASSWORD_LEN) {
    return { ok: false, reason: `password must be at least ${MIN_PASSWORD_LEN} characters` };
  }
  if (password.length > MAX_PASSWORD_LEN) {
    return { ok: false, reason: `password must be at most ${MAX_PASSWORD_LEN} characters` };
  }
  return { ok: true };
}

export function validatePasswordChange(input: {
  currentPassword: string;
  newPassword: string;
}): { ok: true } | { ok: false; reason: string } {
  if (!input.currentPassword || typeof input.currentPassword !== "string") {
    return { ok: false, reason: "currentPassword required" };
  }
  const np = validateNewPassword(input.newPassword);
  if (!np.ok) return np;
  if (input.currentPassword === input.newPassword) {
    return { ok: false, reason: "newPassword must differ from currentPassword" };
  }
  return { ok: true };
}
