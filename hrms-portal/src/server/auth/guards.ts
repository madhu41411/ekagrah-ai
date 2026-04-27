import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSession } from "./session";

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    };
  }

  return { session, response: null };
}

export async function requireRole(roles: UserRole[]) {
  const { session, response } = await requireAuth();

  if (response || !session) {
    return { session: null, response };
  }

  if (!roles.includes(session.role)) {
    return {
      session: null,
      response: NextResponse.json({ message: "Forbidden" }, { status: 403 })
    };
  }

  return { session, response: null };
}
