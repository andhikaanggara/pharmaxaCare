import * as z from "zod";

export const visitSchema = z.object({
  id: z.string(),
  date: z.string(),
  shift: z.string(),
  poly_destination: z.string().default("Umum"),
  registation_id: z.string(),
  nurse_id: z.string(),
  doctor_id: z.string(),
  pharmacist_id: z.string(),
  patient_id: z.string(),
  recipe_type: z.string().default("Biasa"),
  total_amount: z.string(),
  payment: z.number().default(0),
  payment_methode: z.string().default("Cash"),
  create_by: z.string(),
  treatments: z.array(z.any()).optional().default([]),
});
