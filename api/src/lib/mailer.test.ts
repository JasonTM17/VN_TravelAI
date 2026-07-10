import { describe, expect, it } from "vitest";
import { sendMail } from "./mailer.js";

describe("sendMail", () => {
  it("logs when no SMTP_URL", async () => {
    const prev = process.env.SMTP_URL;
    delete process.env.SMTP_URL;
    const r = await sendMail({ to: "a@b.co", subject: "Hi", text: "body" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mode).toBe("log");
    if (prev !== undefined) process.env.SMTP_URL = prev;
  });

  it("posts to http SMTP_URL", async () => {
    const fetchImpl = async () => ({ ok: true, status: 200 }) as Response;
    const r = await sendMail(
      { to: "a@b.co", subject: "Hi", text: "body" },
      { smtpUrl: "http://mail.local/send", fetchImpl },
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mode).toBe("smtp");
  });
});
