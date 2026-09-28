import * as z from "zod";

export const visitsSchema = z.object({
  date: z.string().min(1, "date wajib diisi"),
  shift: z.string().min(1, "shift wajib diisi"),
  poly: z.string().min(1, "poly wajib diisi"),
  pathway: z.string().min(1, "pathway wajib diisi"),
  patient_id: z.string().min(1, "nama pasien wajib diisi"),
  recipe: z.string().min(1, "resep wajib diisi"),
  payment: z.string().min(1, "jumlah pembayaran wajib diisi"),
  payment_methode: z.string().min(1, "metode pembayaran wajib diisi"),
  staff_id: z.array(z.string().uuid()).optional(),
  treatments: z
    .array(
      z.object({
        treatment_id: z.string(),
        operation_id: z.string(),
        assistant_id: z.string(),
      }),
    )
    .optional(),
});

export type VisitsSchema = z.infer<typeof visitsSchema>;
