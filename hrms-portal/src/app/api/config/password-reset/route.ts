import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireRole } from "@/server/auth/guards";
import { resetEmployeePassword } from "@/server/services/config-service";
import { resetEmployeePasswordSchema } from "@/server/validators/config";

export async function POST(request: Request) {
  const { session, response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);
  if (response || !session) return response;

  const body = await request.json();
  const parsed = resetEmployeePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  try {
    await resetEmployeePassword(session.sub, parsed.data.employeeId, parsed.data.newPassword);
    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to reset password" },
      { status: 400 }
    );
  }
}
