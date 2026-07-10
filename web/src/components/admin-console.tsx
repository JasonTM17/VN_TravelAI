"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type AdminAuditRow } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { isAdminRole, readJwtRole } from "@/lib/jwt-role";
import { getDict, type Locale } from "@/lib/i18n";

export function AdminConsole({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [audit, setAudit] = useState<AdminAuditRow[]>([]);

  useEffect(() => {
    const access = getAccessToken();
    setToken(access);
    setRole(readJwtRole(access));
  }, []);

  async function loadAudit(access: string) {
    try {
      const res = await api.adminAudit(access, 15);
      setAudit(res.data ?? []);
    } catch {
      setAudit([]);
    }
  }

  useEffect(() => {
    if (token && isAdminRole(role)) {
      void loadAudit(token);
    }
  }, [token, role]);

  if (!token) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 shadow-elevated">
        <p className="text-sm text-muted">{t.admin.loginRequired}</p>
        <Link href={`/${locale}/login`} className="btn-accent mt-4 inline-flex min-h-11 items-center">
          {t.nav.login}
        </Link>
      </div>
    );
  }

  if (!isAdminRole(role)) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        {t.admin.forbidden}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-console">
      <section className="rounded-2xl border border-border bg-white p-5 shadow-elevated">
        <p className="text-sm text-muted">{t.admin.reindexHint}</p>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted">
          {t.admin.tokenLabel}
          <input
            type="password"
            autoComplete="off"
            className="input-field mt-1 w-full"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            placeholder="X-Admin-Token"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-accent inline-flex min-h-11 items-center disabled:opacity-60"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              setResult(null);
              try {
                const res = await api.adminReindex(token, adminToken.trim() || undefined);
                setResult(JSON.stringify(res.data, null, 2));
                await loadAudit(token);
              } catch (e) {
                setError(e instanceof Error ? e.message : t.common.error);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? t.common.loading : t.admin.reindex}
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-full border border-ocean px-5 text-sm font-semibold text-ocean transition hover:bg-ocean/5 disabled:opacity-60"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              setResult(null);
              try {
                const res = await api.adminReindexVectors(token, adminToken.trim() || undefined);
                setResult(JSON.stringify(res.data, null, 2));
                await loadAudit(token);
              } catch (e) {
                setError(e instanceof Error ? e.message : t.common.error);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? t.common.loading : locale === "vi" ? "Reindex vectors" : "Reindex vectors"}
          </button>
        </div>
        {error ? (
          <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-red-50 p-3 text-xs text-red-800">{error}</pre>
        ) : null}
        {result ? (
          <div className="mt-3">
            <div className="text-xs font-semibold uppercase text-muted">{t.admin.lastResult}</div>
            <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-[#f5f7fa] p-3 text-xs">{result}</pre>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-elevated">
        <h2 className="text-lg font-bold">{t.admin.auditTitle}</h2>
        {audit.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t.admin.emptyAudit}</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {audit.map((row) => (
              <li key={row.id} className="py-3 text-sm">
                <div className="font-semibold text-[#1a1a1a]">{row.action}</div>
                <div className="text-xs text-muted">
                  {new Date(row.createdAt).toLocaleString()} · user {row.userId.slice(0, 8)}…
                </div>
                {row.detail ? (
                  <pre className="mt-1 max-h-24 overflow-auto text-[11px] text-muted">{row.detail}</pre>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
