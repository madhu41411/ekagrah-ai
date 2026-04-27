import { AttendanceStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/services/audit-service";

export async function POST() {
  const { session, response } = await requireAuth();
  if (response || !session?.employeeId) {
    return response ?? NextResponse.json({ message: "Employee profile required" }, { status: 400 });
  }

  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const attendance = await prisma.attendanceRecord.upsert({
    where: {
      employeeId_date: {
        employeeId: session.employeeId,
        date
      }
    },
    update: {
      checkInAt: now,
      status: AttendanceStatus.PRESENT
    },
    create: {
      employeeId: session.employeeId,
      date,
      checkInAt: now,
      status: AttendanceStatus.PRESENT
    }
  });

  await writeAuditLog({
    actorUserId: session.sub,
    action: "attendance.check_in",
    entityType: "AttendanceRecord",
    entityId: attendance.id
  });

  return NextResponse.redirect(new URL("/attendance", process.env.APP_URL ?? "http://localhost:3000"), {
    status: 303
  });
}
