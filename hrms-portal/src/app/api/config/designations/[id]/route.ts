import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireRole } from "@/server/auth/guards";
import { updateDesignation, deleteDesignation } from "@/server/services/config-service";
import { updateDesignationSchema } from "@/server/validators/config";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);
  if (response || !session) return response;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateDesignationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  try {
    const designation = await updateDesignation(session.sub, id, parsed.data);
    return NextResponse.json(designation);
  } catch {
    return NextResponse.json({ message: "A designation with that title already exists" }, { status: 409 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);
  if (response || !session) return response;

  const { id } = await context.params;

  try {
    await deleteDesignation(session.sub, id);
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to delete designation" },
      { status: 409 }
    );
  }
}
