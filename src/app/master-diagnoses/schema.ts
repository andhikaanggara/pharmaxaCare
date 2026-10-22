import * as z from "zod";

export const diagnosisSchema = z.object({
  id: z.string().optional(),
  code: z
    .string()
    .min(1, "Code is required")
    .max(10, "Code is too long")
    .trim(),
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .trim(),
});

export type DiagnosisSchema = z.infer<typeof diagnosisSchema>;
