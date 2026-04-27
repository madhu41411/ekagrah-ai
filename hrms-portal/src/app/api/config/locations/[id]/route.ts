import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireRole } from "@/server/auth/guards";
import { updateLocation, deleteLocation } from "@/server/services/config-service";
import { updateLocationSchema } from "@/server/validators/config";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);
  if (response || !session) return response;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateLocationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  try {
    const location = await updateLocation(session.sub, id, parsed.data);
    return NextResponse.json(location);
  } catch {
    return NextResponse.json({ message: "A location with that name or code already exists" }, { status: 409 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);
  if (response || !session) return response;

  const { id } = await context.params;

  try {
    await deleteLocation(session.sub, id);
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to delete location" },
      { status: 500 }
    );
  }
}
