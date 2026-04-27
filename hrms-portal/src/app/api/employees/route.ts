import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireRole } from "@/server/auth/guards";
import { createEmployee, listEmployees } from "@/server/services/employee-service";
import { createEmployeeSchema } from "@/server/validators/employee";

export async function GET() {
  const { response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);
  if (response) {
    return response;
  }

  const employees = await listEmployees();
  return NextResponse.json(employees);
}

export async function POST(request: Request) {
  const { session, response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);
  if (response || !session) {
    return response;
  }

  const body = await request.json();
  const parsed = createEmployeeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed", errors: parsed.error.flatten() }, { status: 400 });
  }

  const employee = await createEmployee(session.sub, parsed.data);
  return NextResponse.json(employee, { status: 201 });
}
