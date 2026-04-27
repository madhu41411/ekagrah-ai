import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireRole } from "@/server/auth/guards";
import { listDepartments, createDepartment } from "@/server/services/config-service";
import { createDepartmentSchema } from "@/server/validators/config";

export async function GET() {
  const { response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);
  if (response) return response;

  const departments = await listDepartments();
  return NextResponse.json(departments);
}

export async function POST(request: Request) {
  const { session, response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);
  if (response || !session) return response;

  const body = await request.json();
  const parsed = createDepartmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  try {
    const department = await createDepartment(session.sub, parsed.data);
    return NextResponse.json(department, { status: 201 });
  } catch {
    return NextResponse.json({ message: "A department with that name or code already exists" }, { status: 409 });
  }
}
