import * as z from "zod";

export const patientSchema = z.object({
  id: z.string().optional(),
  patient_name: z.string().min(3, "Nama pasien minimal 3 karakter"),
  mr_number: z.string().min(3, "Nomor MR wajib diisi"),
  gender: z.string().min(3, "Pilih atau isi jenis kelamin"),
  birth_date: z.string().min(1, "Tanggal lahir wajib diisi"),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit").or(z.literal("")),
  address: z.string().min(5, "Alamat minimal 5 karakter"),
});

export type PatientSchema = z.infer<typeof patientSchema>;