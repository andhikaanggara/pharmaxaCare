import * as z from "zod";

export const treatmentSchema = z.object({
  id: z.string().optional(),
  treatment_name: z
    .string()
    .min(3, "Treatment Name must be at least 3 characters."),
});

export type TreatmentSchema = z.infer<typeof treatmentSchema>;
