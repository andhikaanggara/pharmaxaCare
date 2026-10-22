import * as z from "zod";

export const patientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Nama pasien minimal 3 karakter"),
  gender: z.string().min(3, "Pilih atau isi jenis kelamin"),
  birth_date: z.string().min(1, "Tanggal lahir wajib diisi"),
  address: z.string().min(5, "Alamat minimal 5 karakter"),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit").or(z.literal("")),
  patient_group: z.string().min(1, "Pilih atau isi kelompok pasien").optional(),
  is_new: z.boolean().optional(),
});

export type PatientSchema = z.infer<typeof patientSchema>;
