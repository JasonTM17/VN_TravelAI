/**
 * Minimal mailer: SMTP if SMTP_URL set, otherwise log-only (status logged).
 * No secrets logged.
 */

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
};

export type SendMailResult = { ok: true; mode: "smtp" | "log" } | { ok: false; error: string };

export async function sendMail(
  input: SendMailInput,
  opts?: { smtpUrl?: string; fetchImpl?: typeof fetch },
): Promise<SendMailResult> {
  const smtpUrl = (opts?.smtpUrl ?? process.env.SMTP_URL ?? "").trim();
  if (!smtpUrl) {
    // eslint-disable-next-line no-console
    console.info("[mailer:log]", { to: input.to, subject: input.subject, bytes: input.text.length });
    return { ok: true, mode: "log" };
  }
  // Optional SMTP via HTTP gateway (e.g. mailpit API) — avoid nodemailer dep if URL is http
  if (smtpUrl.startsWith("http://") || smtpUrl.startsWith("https://")) {
    try {
      const fetchImpl = opts?.fetchImpl ?? globalThis.fetch;
      const res = await fetchImpl(smtpUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to: input.to, subject: input.subject, text: input.text }),
      });
      if (!res.ok) return { ok: false, error: `smtp_http_${res.status}` };
      return { ok: true, mode: "smtp" };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "smtp_error" };
    }
  }
  // Non-HTTP SMTP_URL: log fallback (full SMTP client would need extra package)
  console.info("[mailer:smtp-url-unparsed-log]", { to: input.to, subject: input.subject });
  return { ok: true, mode: "log" };
}
