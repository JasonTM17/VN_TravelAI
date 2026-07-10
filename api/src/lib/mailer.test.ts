import { describe, expect, it } from "vitest";
import { resolveSmtpTransport, sendMail } from "./mailer.js";

describe("resolveSmtpTransport", () => {
  it("detects http gateway", () => {
    expect(resolveSmtpTransport({ smtpUrl: "http://mailpit/send" }).kind).toBe("http");
  });
  it("detects smtp url", () => {
    expect(resolveSmtpTransport({ smtpUrl: "smtp://user:pass@localhost:1025" }).kind).toBe("url");
  });
  it("detects host config", () => {
    const t = resolveSmtpTransport({ smtpHost: "smtp.example.com", smtpPort: 587, smtpUser: "u", smtpPass: "p" });
    expect(t.kind).toBe("host");
    if (t.kind === "host") {
      expect(t.host).toBe("smtp.example.com");
      expect(t.auth?.user).toBe("u");
    }
  });
  it("none when empty", () => {
    expect(resolveSmtpTransport({}).kind).toBe("none");
  });
});

describe("sendMail", () => {
  it("logs when no SMTP configured", async () => {
    const prev = process.env.SMTP_URL;
    const prevH = process.env.SMTP_HOST;
    delete process.env.SMTP_URL;
    delete process.env.SMTP_HOST;
    const r = await sendMail({ to: "a@b.co", subject: "Hi", text: "body" }, {});
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mode).toBe("log");
    if (prev !== undefined) process.env.SMTP_URL = prev;
    if (prevH !== undefined) process.env.SMTP_HOST = prevH;
  });

  it("posts to http SMTP_URL", async () => {
    const fetchImpl = async () => ({ ok: true, status: 200 }) as Response;
    const r = await sendMail(
      { to: "a@b.co", subject: "Hi", text: "body" },
      { smtpUrl: "http://mail.local/send", fetchImpl },
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mode).toBe("http");
  });
});
