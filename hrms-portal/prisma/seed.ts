import { PrismaClient, EmploymentType, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);

  const engineering = await prisma.department.upsert({
    where: { code: "ENG" },
    update: {},
    create: { code: "ENG", name: "Engineering" }
  });

  const hr = await prisma.department.upsert({
    where: { code: "HR" },
    update: {},
    create: { code: "HR", name: "Human Resources" }
  });

  const consultant = await prisma.designation.upsert({
    where: { title: "Consultant" },
    update: {},
    create: { title: "Consultant", level: "L2" }
  });

  const hrManager = await prisma.designation.upsert({
    where: { title: "HR Manager" },
    update: {},
    create: { title: "HR Manager", level: "L3" }
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@company.local" },
    update: {},
    create: {
      email: "admin@company.local",
      passwordHash,
      role: UserRole.SUPER_ADMIN
    }
  });

  const managerUser = await prisma.user.upsert({
    where: { email: "hr@company.local" },
    update: {},
    create: {
      email: "hr@company.local",
      passwordHash,
      role: UserRole.HR_ADMIN
    }
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: "employee@company.local" },
    update: {},
    create: {
      email: "employee@company.local",
      passwordHash,
      role: UserRole.EMPLOYEE
    }
  });

  const manager = await prisma.employee.upsert({
    where: { userId: managerUser.id },
    update: {
      employeeCode: "50001"
    },
    create: {
      userId: managerUser.id,
      employeeCode: "50001",
      firstName: "Asha",
      lastName: "Sharma",
      joiningDate: new Date("2024-01-08"),
      employmentType: EmploymentType.FULL_TIME,
      departmentId: hr.id,
      designationId: hrManager.id,
      workLocation: "Bengaluru"
    }
  });

  const employee = await prisma.employee.upsert({
    where: { userId: employeeUser.id },
    update: {
      employeeCode: "50002"
    },
    create: {
      userId: employeeUser.id,
      employeeCode: "50002",
      firstName: "Rahul",
      lastName: "Verma",
      joiningDate: new Date("2024-06-17"),
      employmentType: EmploymentType.FULL_TIME,
      departmentId: engineering.id,
      designationId: consultant.id,
      managerId: manager.id,
      workLocation: "Pune"
    }
  });

  await prisma.employee.upsert({
    where: { userId: adminUser.id },
    update: {
      employeeCode: "50000"
    },
    create: {
      userId: adminUser.id,
      employeeCode: "50000",
      firstName: "Neha",
      lastName: "Kapoor",
      joiningDate: new Date("2023-04-01"),
      employmentType: EmploymentType.FULL_TIME,
      departmentId: hr.id,
      designationId: hrManager.id,
      workLocation: "Mumbai"
    }
  });

  await prisma.leaveType.upsert({
    where: { code: "CL" },
    update: {},
    create: { code: "CL", name: "Casual Leave", annualQuota: 12 }
  });

  await prisma.leaveType.upsert({
    where: { code: "SL" },
    update: {},
    create: { code: "SL", name: "Sick Leave", annualQuota: 10, requiresProof: true }
  });

  await prisma.leaveType.upsert({
    where: { code: "EL" },
    update: {},
    create: { code: "EL", name: "Earned Leave", annualQuota: 15 }
  });

  await prisma.announcement.create({
    data: {
      title: "Quarterly Townhall",
      body: "Townhall is scheduled for Friday at 4 PM in the main conference room.",
      createdById: adminUser.id
    }
  });

  const casualLeave = await prisma.leaveType.findUniqueOrThrow({ where: { code: "CL" } });

  await prisma.leaveBalance.upsert({
    where: {
      employeeId_leaveTypeId_year: {
        employeeId: employee.id,
        leaveTypeId: casualLeave.id,
        year: new Date().getFullYear()
      }
    },
    update: {},
    create: {
      employeeId: employee.id,
      leaveTypeId: casualLeave.id,
      year: new Date().getFullYear(),
      allocated: 12
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
