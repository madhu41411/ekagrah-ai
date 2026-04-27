import { EmploymentType } from "@prisma/client";
import { z } from "zod";

const strictEmployeeCodeSchema = z.string().regex(/^\d{5}$/, "Employee code must be a 5-digit number");
const editableEmployeeCodeSchema = z
  .string()
  .regex(/^(\d{5}|EMP-\d{4})$/, "Employee code must be a 5-digit number");

const employeeBaseSchema = z.object({
  email: z.string().email(),
  role: z.enum(["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"]),
  employeeCode: strictEmployeeCodeSchema,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  joiningDate: z.string().datetime(),
  employmentType: z.nativeEnum(EmploymentType),
  departmentId: z.string().cuid().optional(),
  designationId: z.string().cuid().optional(),
  managerId: z.string().cuid().optional(),
  workLocation: z.string().optional()
});

export const createEmployeeSchema = employeeBaseSchema.extend({
  password: z.string().min(8)
});

export const updateEmployeeSchema = employeeBaseSchema.extend({
  employeeCode: editableEmployeeCodeSchema
});
