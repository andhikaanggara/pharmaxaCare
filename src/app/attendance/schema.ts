import * as z from "zod";

export const attendanceSchema = z.object({
  date: z.string().min(1, "Tanggal Wajib diisi."),
  shift: z.string().min(1, "Shift Wajib Diisi."),
  staffId: z.array(z.string()).min(1, "Minimal satu staff harus dipilih"),
});

export type AttendanceSchema = z.infer<typeof attendanceSchema>;
