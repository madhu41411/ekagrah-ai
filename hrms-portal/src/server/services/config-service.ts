import bcrypt from "bcryptjs";
import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "./audit-service";
import { UserRole } from "@prisma/client";

// ── Departments ───────────────────────────────────────────────────────────────

export async function listDepartments() {
  return prisma.department.findMany({
    where: { deletedAt: null },
    include: {
      _count: { select: { employees: true } }
    },
    orderBy: { name: "asc" }
  });
}

export async function createDepartment(actorUserId: string, data: { name: string; code: string }) {
  const department = await prisma.department.create({
    data: { name: data.name.trim(), code: data.code.trim().toUpperCase() }
  });
  await writeAuditLog({ actorUserId, action: "department.create", entityType: "Department", entityId: department.id, metadata: { name: department.name } });
  return department;
}

export async function updateDepartment(actorUserId: string, id: string, data: { name: string; code: string }) {
  const department = await prisma.department.update({
    where: { id },
    data: { name: data.name.trim(), code: data.code.trim().toUpperCase() }
  });
  await writeAuditLog({ actorUserId, action: "department.update", entityType: "Department", entityId: department.id, metadata: { name: department.name } });
  return department;
}

export async function deleteDepartment(actorUserId: string, id: string) {
  const used = await prisma.employee.count({ where: { departmentId: id, deletedAt: null } });
  if (used > 0) {
    throw new Error(`Cannot delete: ${used} active employee(s) belong to this department`);
  }
  await prisma.department.update({ where: { id }, data: { deletedAt: new Date() } });
  await writeAuditLog({ actorUserId, action: "department.delete", entityType: "Department", entityId: id });
}

// ── Designations ──────────────────────────────────────────────────────────────

export async function listDesignations() {
  return prisma.designation.findMany({
    where: { deletedAt: null },
    include: {
      _count: { select: { employees: true } }
    },
    orderBy: { title: "asc" }
  });
}

export async function createDesignation(actorUserId: string, data: { title: string; level?: string }) {
  const designation = await prisma.designation.create({
    data: { title: data.title.trim(), level: data.level?.trim() || null }
  });
  await writeAuditLog({ actorUserId, action: "designation.create", entityType: "Designation", entityId: designation.id, metadata: { title: designation.title } });
  return designation;
}

export async function updateDesignation(actorUserId: string, id: string, data: { title: string; level?: string }) {
  const designation = await prisma.designation.update({
    where: { id },
    data: { title: data.title.trim(), level: data.level?.trim() || null }
  });
  await writeAuditLog({ actorUserId, action: "designation.update", entityType: "Designation", entityId: designation.id, metadata: { title: designation.title } });
  return designation;
}

export async function deleteDesignation(actorUserId: string, id: string) {
  const used = await prisma.employee.count({ where: { designationId: id, deletedAt: null } });
  if (used > 0) {
    throw new Error(`Cannot delete: ${used} active employee(s) hold this designation`);
  }
  await prisma.designation.update({ where: { id }, data: { deletedAt: new Date() } });
  await writeAuditLog({ actorUserId, action: "designation.delete", entityType: "Designation", entityId: id });
}

// ── Work Locations ────────────────────────────────────────────────────────────

export async function listLocations() {
  return prisma.workLocation.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" }
  });
}

export async function createLocation(actorUserId: string, data: { name: string; code: string }) {
  const location = await prisma.workLocation.create({
    data: { name: data.name.trim(), code: data.code.trim().toUpperCase() }
  });
  await writeAuditLog({ actorUserId, action: "location.create", entityType: "WorkLocation", entityId: location.id, metadata: { name: location.name } });
  return location;
}

export async function updateLocation(actorUserId: string, id: string, data: { name: string; code: string }) {
  const location = await prisma.workLocation.update({
    where: { id },
    data: { name: data.name.trim(), code: data.code.trim().toUpperCase() }
  });
  await writeAuditLog({ actorUserId, action: "location.update", entityType: "WorkLocation", entityId: location.id, metadata: { name: location.name } });
  return location;
}

export async function deleteLocation(actorUserId: string, id: string) {
  await prisma.workLocation.update({ where: { id }, data: { deletedAt: new Date() } });
  await writeAuditLog({ actorUserId, action: "location.delete", entityType: "WorkLocation", entityId: id });
}

// ── Password Reset ────────────────────────────────────────────────────────────

export async function resetEmployeePassword(actorUserId: string, employeeId: string, newPassword: string) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: true }
  });

  if (!employee || employee.deletedAt) {
    throw new Error("Employee not found");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: employee.userId }, data: { passwordHash } });
  await writeAuditLog({ actorUserId, action: "password.reset", entityType: "User", entityId: employee.userId, metadata: { employeeId } });
}

export async function resetSelfPassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error("User not found");
  }

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    throw new Error("Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await writeAuditLog({ actorUserId: userId, action: "password.self_reset", entityType: "User", entityId: userId });
}

// ── Role stats ────────────────────────────────────────────────────────────────

export async function getRoleStats() {
  const counts = await prisma.user.groupBy({
    by: ["role"],
    where: { deletedAt: null, status: "ACTIVE" },
    _count: { role: true }
  });

  const descriptions: Record<UserRole, string> = {
    SUPER_ADMIN: "Full system access — manage all settings, employees, and configuration",
    HR_ADMIN: "Manage employees, onboarding, leave, attendance, and announcements",
    MANAGER: "View team attendance and leave requests; post announcements",
    EMPLOYEE: "Personal attendance, leave requests, and announcements"
  };

  return (Object.values(UserRole) as UserRole[]).map((role) => ({
    role,
    description: descriptions[role],
    count: counts.find((c) => c.role === role)?._count.role ?? 0
  }));
}
