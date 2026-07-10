import { prisma } from "../db.js";

export async function writeAdminAudit(entry: {
  userId: string;
  action: string;
  detail?: string;
  ip?: string;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        detail: entry.detail ?? null,
        ip: entry.ip ?? null,
      },
    });
  } catch (err) {
    // Never fail the admin action solely because audit write failed
    console.warn("admin audit write failed", err);
  }
}
