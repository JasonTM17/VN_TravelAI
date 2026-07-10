/**
 * Mailer: nodemailer SMTP, HTTP gateway, or log-only.
 * Never logs passwords or full message bodies with secrets.
 */

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendMailResult =
  | { ok: true; mode: "smtp" | "http" | "log" }
  | { ok: false; error: string };

export type MailerEnv = {
  smtpUrl?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  smtpFrom?: string;
};

function envFromProcess(): MailerEnv {
  return {
    smtpUrl: process.env.SMTP_URL?.trim(),
    smtpHost: process.env.SMTP_HOST?.trim(),
    smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    smtpUser: process.env.SMTP_USER?.trim(),
    smtpPass: process.env.SMTP_PASS?.trim(),
    smtpSecure: process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1",
    smtpFrom: process.env.SMTP_FROM?.trim() || "TravelAI <noreply@travelai.local>",
  };
}

/** Build nodemailer transport options from env (exported for tests). */
export function resolveSmtpTransport(env: MailerEnv):
  | { kind: "url"; url: string }
  | { kind: "host"; host: string; port: number; secure: boolean; auth?: { user: string; pass: string } }
  | { kind: "http"; url: string }
  | { kind: "none" } {
  const url = env.smtpUrl?.trim() ?? "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return { kind: "http", url };
  }
  if (url.startsWith("smtp://") || url.startsWith("smtps://")) {
    return { kind: "url", url };
  }
  if (env.smtpHost) {
    const port = env.smtpPort && Number.isFinite(env.smtpPort) ? env.smtpPort : env.smtpSecure ? 465 : 587;
    const auth =
      env.smtpUser && env.smtpPass ? { user: env.smtpUser, pass: env.smtpPass } : undefined;
    return {
      kind: "host",
      host: env.smtpHost,
      port,
      secure: Boolean(env.smtpSecure) || port === 465,
      auth,
    };
  }
  return { kind: "none" };
}

export async function sendMail(
  input: SendMailInput,
  opts?: MailerEnv & { fetchImpl?: typeof fetch },
): Promise<SendMailResult> {
  const env = { ...envFromProcess(), ...opts };
  const transport = resolveSmtpTransport(env);
  const from = env.smtpFrom || "TravelAI <noreply@travelai.local>";

  if (transport.kind === "none") {
    console.info("[mailer:log]", { to: input.to, subject: input.subject, bytes: input.text.length });
    return { ok: true, mode: "log" };
  }

  if (transport.kind === "http") {
    try {
      const fetchImpl = opts?.fetchImpl ?? globalThis.fetch;
      const res = await fetchImpl(transport.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          to: input.to,
          subject: input.subject,
          text: input.text,
          html: input.html,
          from,
        }),
      });
      if (!res.ok) return { ok: false, error: `smtp_http_${res.status}` };
      return { ok: true, mode: "http" };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "smtp_http_error" };
    }
  }

  try {
    // Dynamic import so unit tests without native smtp still load
    const nodemailer = await import("nodemailer");
    const transporter =
      transport.kind === "url"
        ? nodemailer.createTransport(transport.url)
        : nodemailer.createTransport({
            host: transport.host,
            port: transport.port,
            secure: transport.secure,
            auth: transport.auth,
          });
    await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { ok: true, mode: "smtp" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "smtp_error" };
  }
}
