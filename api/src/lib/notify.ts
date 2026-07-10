import { prisma } from "../db.js";
import { sendMail } from "./mailer.js";

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
    const sent = await sendMail({ to: emailTo, subject: title, text: body });
    await prisma.notification.update({
      where: { id: row.id },
      data: {
        status: sent.ok ? (sent.mode === "log" ? "logged" : "sent") : "failed",
        sentAt: sent.ok ? new Date() : null,
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
