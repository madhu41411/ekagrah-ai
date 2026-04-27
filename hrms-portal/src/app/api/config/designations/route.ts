import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireRole } from "@/server/auth/guards";
import { listDesignations, createDesignation } from "@/server/services/config-service";
import { createDesignationSchema } from "@/server/validators/config";

export async function GET() {
  const { response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);
  if (response) return response;

  const designations = await listDesignations();
  return NextResponse.json(designations);
}

export async function POST(request: Request) {
  const { session, response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);
  if (response || !session) return response;

  const body = await request.json();
  const parsed = createDesignationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  try {
    const designation = await createDesignation(session.sub, parsed.data);
    return NextResponse.json(designation, { status: 201 });
  } catch {
    return NextResponse.json({ message: "A designation with that title already exists" }, { status: 409 });
  }
}
