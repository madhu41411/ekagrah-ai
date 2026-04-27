import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireRole } from "@/server/auth/guards";
import { resetSelfPassword } from "@/server/services/config-service";
import { resetSelfPasswordSchema } from "@/server/validators/config";

export async function POST(request: Request) {
  const { session, response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);
  if (response || !session) return response;

  const body = await request.json();
  const parsed = resetSelfPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  try {
    await resetSelfPassword(session.sub, parsed.data.currentPassword, parsed.data.newPassword);
    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to change password" },
      { status: 400 }
    );
  }
}
