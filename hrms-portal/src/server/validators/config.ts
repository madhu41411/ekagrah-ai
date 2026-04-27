import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z.string().min(1, "Code is required").max(20)
});

export const updateDepartmentSchema = createDepartmentSchema;

export const createDesignationSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  level: z.string().max(50).optional()
});

export const updateDesignationSchema = createDesignationSchema;

export const createLocationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z.string().min(1, "Code is required").max(20)
});

export const updateLocationSchema = createLocationSchema;

export const resetEmployeePasswordSchema = z.object({
  employeeId: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
});

export const resetSelfPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
});
