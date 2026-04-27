import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { requireRole } from "@/server/auth/guards";
import { createAnnouncementSchema } from "@/server/validators/announcement";
import { writeAuditLog } from "@/server/services/audit-service";

export async function GET() {
  const announcements = await prisma.announcement.findMany({
    include: { createdBy: { select: { email: true } } },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(announcements);
}

export async function POST(request: Request) {
  const { session, response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);
  if (response || !session) {
    return response;
  }

  const body = await request.json();
  const parsed = createAnnouncementSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed", errors: parsed.error.flatten() }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      ...parsed.data,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      createdById: session.sub
    }
  });

  await writeAuditLog({
    actorUserId: session.sub,
    action: "announcement.create",
    entityType: "Announcement",
    entityId: announcement.id
  });

  return NextResponse.json(announcement, { status: 201 });
}
