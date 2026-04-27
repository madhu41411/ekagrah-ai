import { z } from "zod";

export const createLeaveSchema = z.object({
  leaveTypeId: z.string().cuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  days: z.number().positive(),
  reason: z.string().max(500).optional()
});
