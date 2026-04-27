import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireRole } from "@/server/auth/guards";
import { createOnboardingDocument, listOnboardingDocuments } from "@/server/services/onboarding-service";
import { createOnboardingDocumentSchema } from "@/server/validators/onboarding";

export async function GET() {
  const { response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);

  if (response) {
    return response;
  }

  const documents = await listOnboardingDocuments();
  return NextResponse.json(documents);
}

export async function POST(request: Request) {
  const { session, response } = await requireRole([UserRole.SUPER_ADMIN, UserRole.HR_ADMIN]);

  if (response || !session) {
    return response;
  }

  const body = await request.json();
  const parsed = createOnboardingDocumentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Validation failed", errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const document = await createOnboardingDocument(session.sub, parsed.data);
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to generate document" },
      { status: 400 }
    );
  }
}
