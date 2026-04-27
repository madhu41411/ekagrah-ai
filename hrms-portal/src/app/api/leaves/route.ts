import { NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/guards";
import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/services/audit-service";
import { createLeaveSchema } from "@/server/validators/leave";

export async function GET() {
  const { session, response } = await requireAuth();
  if (response || !session?.employeeId) {
    return response ?? NextResponse.json({ message: "Employee profile required" }, { status: 400 });
  }

  const requests = await prisma.leaveRequest.findMany({
    where: { employeeId: session.employeeId },
    include: { leaveType: true },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(requests);
}

export async function POST(request: Request) {
  const { session, response } = await requireAuth();
  if (response || !session?.employeeId) {
    return response ?? NextResponse.json({ message: "Employee profile required" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = createLeaveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed", errors: parsed.error.flatten() }, { status: 400 });
  }

  const leave = await prisma.leaveRequest.create({
    data: {
      employeeId: session.employeeId,
      leaveTypeId: parsed.data.leaveTypeId,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      days: parsed.data.days,
      reason: parsed.data.reason
    }
  });

  await writeAuditLog({
    actorUserId: session.sub,
    action: "leave.apply",
    entityType: "LeaveRequest",
    entityId: leave.id
  });

  return NextResponse.json(leave, { status: 201 });
}
