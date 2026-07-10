import { prisma } from "../db.js";
import { sendMail } from "./mailer.js";

function bookingConfirmedHtml(bookingId: string, totalVnd: number): string {
  const total = totalVnd.toLocaleString("vi-VN");
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#0f172a">
  <h2 style="color:#0ea5e9">TravelAI — Booking confirmed</h2>
  <p>Your booking <strong>${bookingId}</strong> is confirmed.</p>
  <p>Total: <strong>${total} VND</strong> (mock pay).</p>
  <p style="color:#64748b;font-size:12px">This is an automated message from TravelAI.</p>
</body></html>`;
}

export async function notifyBookingConfirmed(opts: {
  userId: string;
  email?: string;
  bookingId: string;
  totalVnd: number;
}) {
  const title = "Booking confirmed";
  const body = `Your TravelAI booking ${opts.bookingId} is confirmed. Total: ${opts.totalVnd.toLocaleString("vi-VN")} VND (mock pay).`;
  const emailTo = opts.email?.trim() || null;

  const row = await prisma.notification.create({
    data: {
      userId: opts.userId,
      channel: emailTo ? "email" : "in_app",
      type: "booking_confirmed",
      title,
      body,
      emailTo,
      status: "pending",
      meta: { bookingId: opts.bookingId },
    },
  });

  if (emailTo) {
    const sent = await sendMail({
      to: emailTo,
      subject: title,
      text: body,
      html: bookingConfirmedHtml(opts.bookingId, opts.totalVnd),
    });
    await prisma.notification.update({
      where: { id: row.id },
      data: {
        status: sent.ok ? (sent.mode === "log" ? "logged" : "sent") : "failed",
        sentAt: sent.ok ? new Date() : null,
        meta: {
          bookingId: opts.bookingId,
          mailMode: sent.ok ? sent.mode : undefined,
          mailError: sent.ok ? undefined : sent.error,
        },
      },
    });
  } else {
    await prisma.notification.update({
      where: { id: row.id },
      data: { status: "logged", sentAt: new Date() },
    });
  }
  return row.id;
}
