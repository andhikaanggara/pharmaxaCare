import * as z from "zod";

export const visitsSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  shift: z.string(),
  registation_id: z.string().optional(),
  nurse_id: z.string().optional(),
  doctor_id: z.string().optional(),
  pharmacist_id: z.string().optional(),
  patient_id: z.string(),
  poly: z.string(),
  recipe: z.string(),
  payment: z.number(),
  payment_methode: z.string(),
  treatments: z
    .array(
      z.object({
        id: z.string(),
        treatment_name: z.string(),
        operation: z.string(),
        assistant: z.string(),
      }),
    )
    .optional(),
});

export type VisitsSchema = z.infer<typeof visitsSchema>;
