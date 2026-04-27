import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

type AuditInput = {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAuditLog(input: AuditInput) {
  await prisma.auditLog.create({
    data: input
  });
}
