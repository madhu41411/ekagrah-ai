import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().min(3).max(120),
  body: z.string().min(10).max(2000),
  audienceType: z.enum(["ALL", "DEPARTMENT", "ROLE"]).default("ALL"),
  targetRole: z.enum(["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
  departmentId: z.string().cuid().optional(),
  expiresAt: z.string().datetime().optional()
});
