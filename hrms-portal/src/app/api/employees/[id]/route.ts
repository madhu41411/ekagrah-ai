import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireRole } from "@/server/auth/guards";
import { updateEmployee } from "@/server/services/employee-service";
import { updateEmployeeSchema } from "@/server/validators/employee";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);

  if (response || !session) {
    return response;
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateEmployeeSchema.safeParse(body);

  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    const firstFieldError = Object.values(flattened.fieldErrors).flat()[0];
    return NextResponse.json(
      {
        message: firstFieldError ?? "Validation failed",
        errors: flattened
      },
      { status: 400 }
    );
  }

  try {
    const employee = await updateEmployee(session.sub, id, parsed.data);
    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update employee" },
      { status: 404 }
    );
  }
}
