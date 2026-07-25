import * as z from "zod";


export const attendanceSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi."),
  shift: z.enum(["Pagi", "Sore", "Malam"]),
  staff_id: z
    .array(z.string().optional().nullable())
    .refine(
      (ids) => ids.some((id) => id && id.trim() !== ""),
      { message: "Minimal satu staff harus dipilih." }
    ),
});

export type AttendanceSchema = z.infer<typeof attendanceSchema>;

export type GroupedAttendance = {
  id: string;
  date: string;
  shift: string;
  [roleName: string]: string;
};

export type AttendanceFormData = {
  date: string;
  shift: string;
  [roleIdKey: string]: string;
};
