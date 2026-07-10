"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/auth-storage";
import { getDict, type Locale } from "@/lib/i18n";

export function AuthForm({ locale, mode }: { locale: Locale; mode: "login" | "register" }) {
  const t = getDict(locale);
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("demo@travelai.local");
  const [password, setPassword] = useState("DemoTravelAI1!");
  const [fullName, setFullName] = useState("TravelAI Demo");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-4"
      data-testid="auth-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
          const res =
            mode === "login"
              ? await api.login(email, password)
              : await api.register(email, password, fullName);
          saveSession(res.data.accessToken, res.data.refreshToken);
          const next = search.get("next");
          const safeNext =
            next && next.startsWith(`/${locale}`) && !next.startsWith("//")
              ? next
              : `/${locale}/bookings`;
          router.push(safeNext);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Auth failed");
        } finally {
          setLoading(false);
        }
      }}
    >
      {mode === "register" ? (
        <label className="block text-sm">
          {t.auth.fullName}
          <input
            className="input-field mt-1"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </label>
      ) : null}
      <label className="block text-sm">
        {t.auth.email}
        <input
          type="email"
          className="input-field mt-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="block text-sm">
        {t.auth.password}
        <input
          type="password"
          className="input-field mt-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </label>
      {error ? <p className="text-sm text-coral">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full disabled:opacity-60"
      >
        {loading ? "..." : mode === "login" ? t.auth.submitLogin : t.auth.submitRegister}
      </button>
    </form>
  );
}
