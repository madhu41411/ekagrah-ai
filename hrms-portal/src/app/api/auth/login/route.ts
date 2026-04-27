import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { loginSchema } from "@/server/validators/auth";
import { prisma } from "@/server/db/prisma";
import { createSessionToken, setSessionCookie } from "@/server/auth/session";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid credentials payload" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { employee: true }
  });

  if (!user || user.deletedAt || user.status !== "ACTIVE") {
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!passwordMatches) {
    return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
  }

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employee?.id
  });

  await setSessionCookie(token);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  return NextResponse.json({ message: "Logged in" });
}
