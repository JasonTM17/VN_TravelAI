/**
 * Auth token JSON payload. Refresh is delivered via httpOnly cookie by default.
 */

export type AuthUserPublic = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
};

export function buildAuthData(opts: {
  accessToken: string;
  expiresIn: number;
  user: AuthUserPublic;
  refreshRaw: string;
  allowBodyRefresh: boolean;
}): Record<string, unknown> {
  const data: Record<string, unknown> = {
    accessToken: opts.accessToken,
    expiresIn: opts.expiresIn,
    user: opts.user,
  };
  if (opts.allowBodyRefresh) {
    data.refreshToken = opts.refreshRaw;
  }
  return data;
}
