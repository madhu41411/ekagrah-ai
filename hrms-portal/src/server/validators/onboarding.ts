import { z } from "zod";

export const createOnboardingDocumentSchema = z.object({
  employeeId: z.string().cuid(),
  letterType: z.enum([
    "OFFER_LETTER",
    "APPOINTMENT_LETTER",
    "INCREMENT_LETTER",
    "EXPERIENCE_LETTER"
  ]),
  title: z.string().min(3).max(120),
  notes: z.string().max(1000).optional()
});
