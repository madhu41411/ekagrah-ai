import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireRole } from "@/server/auth/guards";
import { updateDepartment, deleteDepartment } from "@/server/services/config-service";
import { updateDepartmentSchema } from "@/server/validators/config";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);
  if (response || !session) return response;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateDepartmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  try {
    const department = await updateDepartment(session.sub, id, parsed.data);
    return NextResponse.json(department);
  } catch {
    return NextResponse.json({ message: "A department with that name or code already exists" }, { status: 409 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);
  if (response || !session) return response;

  const { id } = await context.params;

  try {
    await deleteDepartment(session.sub, id);
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to delete department" },
      { status: 409 }
    );
  }
}
