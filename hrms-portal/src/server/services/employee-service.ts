import bcrypt from "bcryptjs";
import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "./audit-service";
import type { Prisma, UserRole } from "@prisma/client";

export async function listEmployees() {
  return prisma.employee.findMany({
    where: { deletedAt: null },
    include: {
      department: true,
      designation: true,
      manager: {
        select: {
          firstName: true,
          lastName: true,
          employeeCode: true
        }
      },
      user: {
        select: {
          email: true,
          role: true,
          status: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function getEmployeeManagementOptions() {
  const [departments, designations, managers] = await Promise.all([
    prisma.department.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" }
    }),
    prisma.designation.findMany({
      where: { deletedAt: null },
      orderBy: { title: "asc" }
    }),
    prisma.employee.findMany({
      where: {
        deletedAt: null,
        user: {
          role: {
            in: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"]
          }
        }
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true
      }
    })
  ]);

  return {
    departments,
    designations,
    managers
  };
}

export async function listEmployeesForOnboarding() {
  return prisma.employee.findMany({
    where: { deletedAt: null },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      joiningDate: true,
      workLocation: true,
      department: {
        select: {
          name: true
        }
      },
      designation: {
        select: {
          title: true
        }
      },
      user: {
        select: {
          email: true
        }
      }
    }
  });
}

type CreateEmployeeInput = {
  email: string;
  password: string;
  role: UserRole;
  employeeCode: string;
  firstName: string;
  lastName: string;
  joiningDate: string;
  employmentType: Prisma.EmployeeCreateInput["employmentType"];
  departmentId?: string;
  designationId?: string;
  managerId?: string;
  workLocation?: string;
};

export async function createEmployee(actorUserId: string, input: CreateEmployeeInput) {
  const passwordHash = await bcrypt.hash(input.password, 10);

  const employee = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: input.role
      }
    });

    return tx.employee.create({
      data: {
        userId: user.id,
        employeeCode: input.employeeCode,
        firstName: input.firstName,
        lastName: input.lastName,
        joiningDate: new Date(input.joiningDate),
        employmentType: input.employmentType,
        departmentId: input.departmentId,
        designationId: input.designationId,
        managerId: input.managerId,
        workLocation: input.workLocation
      }
    });
  });

  await writeAuditLog({
    actorUserId,
    action: "employee.create",
    entityType: "Employee",
    entityId: employee.id,
    metadata: { employeeCode: employee.employeeCode }
  });

  return employee;
}

type UpdateEmployeeInput = {
  email: string;
  role: UserRole;
  employeeCode: string;
  firstName: string;
  lastName: string;
  joiningDate: string;
  employmentType: Prisma.EmployeeCreateInput["employmentType"];
  departmentId?: string;
  designationId?: string;
  managerId?: string;
  workLocation?: string;
};

export async function updateEmployee(actorUserId: string, employeeId: string, input: UpdateEmployeeInput) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { user: true }
  });

  if (!employee || employee.deletedAt) {
    throw new Error("Employee not found");
  }

  const updatedEmployee = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: employee.userId },
      data: {
        email: input.email,
        role: input.role
      }
    });

    return tx.employee.update({
      where: { id: employeeId },
      data: {
        employeeCode: input.employeeCode,
        firstName: input.firstName,
        lastName: input.lastName,
        joiningDate: new Date(input.joiningDate),
        employmentType: input.employmentType,
        departmentId: input.departmentId,
        designationId: input.designationId,
        managerId: input.managerId,
        workLocation: input.workLocation
      }
    });
  });

  await writeAuditLog({
    actorUserId,
    action: "employee.update",
    entityType: "Employee",
    entityId: updatedEmployee.id,
    metadata: { employeeCode: updatedEmployee.employeeCode }
  });

  return updatedEmployee;
}
