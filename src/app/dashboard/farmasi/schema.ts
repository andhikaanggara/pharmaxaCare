import * as z from "zod";

export const farmasiVisitSchema = z.object({
  id: z.string().optional(),
  // Identifikasi
  tanggal_dispensing: z.string().min(1, "Tanggal dispensing wajib diisi"),
  shift_dispensing: z.enum(["Pagi", "Sore", "Malam"]),
  id_staff_farmasi: z.string().min(1, "Staf farmasi wajib diisi"),
  id_staff_apoteker: z.string().min(1, "Apoteker wajib diisi"),
  id_visit: z.string().optional(),
  id_patient: z.string().min(1, "Pasien wajib diisi"),
  
  // Klinis
  poli: z.enum(["Umum", "Gigi"]),
  penjamin: z.enum(["Mandiri", "BPJS"]),
  penanganan: z.enum([
    "Rawat Jalan", 
    "Rujukan", 
    "Surat Sehat", 
    "Copy Resep", 
    "Lab", 
    "Observasi", 
    "Infus Vitamin", 
    "Rawat Inap", 
    "Home Visit"
  ]),
  jenis_resep: z.enum(["Biasa", "Racikan", "Tidak Ada"]),

  // Kondisional (Rawat Inap / Home Visit)
  kamar: z.string().optional(),
  tanggal_datang: z.string().optional(),
  tanggal_pulang: z.string().optional(),
  lama_perawatan: z.number().optional(),
  cara_pulang: z.string().optional(),

  // Transaksi
  nominal_terbayar: z.number().min(0, "Nominal tidak boleh negatif"),
  metode_pembayaran: z.enum(["Cash", "BPJS", "Transfer", "QRIS", "Tidak Bayar"]),
});

export type FarmasiVisitSchema = z.infer<typeof farmasiVisitSchema>;
