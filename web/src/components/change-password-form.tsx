"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { clearSession, getAccessToken } from "@/lib/auth-storage";
import { getDict, type Locale } from "@/lib/i18n";

export function ChangePasswordForm({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const router = useRouter();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-4"
      data-testid="change-password-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setOk(false);
        if (newPassword !== confirm) {
          setError(t.auth.passwordMismatch);
          return;
        }
        const token = getAccessToken();
        if (!token) {
          router.push(`/${locale}/login?next=/${locale}/account`);
          return;
        }
        setLoading(true);
        try {
          await api.changePassword(token, currentPassword, newPassword);
          setCurrent("");
          setNew("");
          setConfirm("");
          // Refresh tokens revoked server-side — clear session after success is visible
          setOk(true);
          clearSession();
        } catch (err) {
          setError(err instanceof Error ? err.message : t.common.error);
        } finally {
          setLoading(false);
        }
      }}
    >
      <h2 className="text-lg font-bold">{t.auth.changePassword}</h2>
      <label className="block text-sm">
        {t.auth.currentPassword}
        <input
          type="password"
          name="currentPassword"
          className="input-field mt-1"
          value={currentPassword}
          onChange={(e) => setCurrent(e.target.value)}
          required
          minLength={1}
          autoComplete="current-password"
          data-testid="current-password"
        />
      </label>
      <label className="block text-sm">
        {t.auth.newPassword}
        <input
          type="password"
          name="newPassword"
          className="input-field mt-1"
          value={newPassword}
          onChange={(e) => setNew(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          data-testid="new-password"
        />
      </label>
      <label className="block text-sm">
        {t.auth.confirmPassword}
        <input
          type="password"
          name="confirmPassword"
          className="input-field mt-1"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          data-testid="confirm-password"
        />
      </label>
      {error ? (
        <p className="text-sm text-coral" data-testid="change-password-error">
          {error}
        </p>
      ) : null}
      {ok ? (
        <div className="space-y-3" data-testid="change-password-ok">
          <p className="text-sm text-[#00a86b]">{t.auth.changePasswordOk}</p>
          <button
            type="button"
            className="btn-primary w-full"
            data-testid="change-password-relogin"
            onClick={() => router.push(`/${locale}/login?next=/${locale}/account`)}
          >
            {t.auth.submitLogin}
          </button>
        </div>
      ) : (
        <button type="submit" className="btn-primary w-full disabled:opacity-60" disabled={loading}>
          {loading ? t.common.loading : t.auth.submitChangePassword}
        </button>
      )}
    </form>
  );
}
