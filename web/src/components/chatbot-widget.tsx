"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { getDict, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "ai"; text: string; degraded?: boolean };

export function ChatbotWidget({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: t.chatbot.welcome },
  ]);
  const listRef = useRef<HTMLDivElement>(null);

  // Hide FAB on dedicated AI planner page (still available elsewhere)
  const hideOnAiPage = pathname?.includes("/ai");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const chips =
    locale === "vi"
      ? ["3 ngày Hội An couple", "Khách sạn Đà Nẵng gần biển", "Tour Hạ Long 1 ngày"]
      : ["3 days Hoi An couple", "Da Nang beach hotel", "Ha Long day cruise"];

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const token = getAccessToken();
    if (!token) {
      setError("auth");
      return;
    }
    setError(null);
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.chat(token, trimmed, conversationId);
      setConversationId(res.data.conversationId);
      setMessages((m) => [
        ...m,
        { role: "ai", text: res.data.reply, degraded: res.data.degraded },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }

  if (hideOnAiPage) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.chatbot.title}
          aria-expanded={open}
          className="pointer-events-auto flex h-[min(520px,70vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-float"
        >
          <header className="flex items-center justify-between bg-[#0064d2] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-bold leading-tight">{t.chatbot.title}</div>
                <div className="text-[11px] text-white/80">{t.chatbot.subtitle}</div>
              </div>
            </div>
            <button
              type="button"
              className="rounded-md p-1 hover:bg-white/15"
              aria-label={t.chatbot.close}
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-[#f5f7fa] p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm",
                  m.role === "user"
                    ? "ml-auto bg-[#0064d2] text-white"
                    : "mr-auto border border-border bg-white text-[#1a1a1a]",
                )}
              >
                {m.text}
                {m.degraded ? (
                  <div className="mt-1 text-[11px] text-[#ff6d00]">{t.ai.degraded}</div>
                ) : null}
              </div>
            ))}
            {loading ? (
              <div className="mr-auto w-24 animate-shimmer rounded-2xl px-3 py-4 text-xs text-muted">
                …
              </div>
            ) : null}
          </div>

          <div className="space-y-2 border-t border-border bg-white p-3">
            {error === "auth" ? (
              <div className="rounded-lg bg-[#fff4e8] px-3 py-2 text-xs text-[#9a3412]">
                {t.chatbot.loginHint}{" "}
                <Link href={`/${locale}/login`} className="font-semibold text-[#0064d2] underline">
                  {t.nav.login}
                </Link>
              </div>
            ) : error ? (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
            ) : null}

            <div className="flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="rounded-full border border-border bg-[#f5f7fa] px-2.5 py-1 text-[11px] font-medium text-[#1a1a1a] hover:border-[#0064d2] hover:text-[#0064d2]"
                  onClick={() => {
                    setInput(c);
                    void send(c);
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.chatbot.placeholder}
                className="input-field flex-1 py-2 text-sm"
                aria-label={t.chatbot.placeholder}
              />
              <button type="submit" className="btn-accent px-3" disabled={loading} aria-label={t.chatbot.send}>
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-[#ff6d00] px-4 py-3 text-sm font-bold text-white shadow-glow transition hover:bg-[#e65100]"
        aria-expanded={open}
        aria-label={t.chatbot.open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span className="hidden sm:inline">{open ? t.chatbot.close : t.chatbot.open}</span>
      </button>
    </div>
  );
}
