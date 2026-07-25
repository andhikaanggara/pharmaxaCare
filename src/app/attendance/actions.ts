"use server";

import { revalidatePath } from "next/cache";
import { authAction } from "@/utils/action";
import { attendanceSchema } from "./schema";

export type AttendanceActionState = { error?: string; ok?: true };

const PATH = "/attendance";

// ======
// === CREATE ATTENDANCE ===
export async function createAttendance(formData: FormData) {
  return authAction(async ({ supabase, isGuest }) => {
    const raw = {
      date: formData.get("date"),
      shift: formData.get("shift"),
      staff_id: formData.getAll("staff_id"),
    };

    const validate = attendanceSchema.safeParse(raw);
    if (!validate.success) throw new Error("Invalid input data.");

    const { date, shift, staff_id } = validate.data;

    const payload = staff_id
      .filter((id) => id && id !== "null" && id !== "undefined")
      .map((id) => ({
        date,
        shift,
        staff_id: id,
        is_demo: isGuest,
      }));

    if (payload.length === 0) {
      throw new Error("Minimal satu staff harus dipilih.");
    }

    const { error } = await supabase.from("attendance").insert(payload);
    if (error)
      throw new Error(`Failed to create attendance: ${error.message}.`);

    revalidatePath(PATH);
    return { ok: true };
  });
}

// ======
// === UPDATE ATTANDANCE ===
export async function updateAttendance(
  originalDate: string,
  originalShift: string,
  formData: FormData,
) {
  return authAction(async ({ supabase, isGuest }) => {
    // Konversi FormData to Plain object
    const raw = {
      date: formData.get("date"),
      shift: formData.get("shift"),
      staff_id: formData.getAll("staff_id"),
    };

    // Validasi zod
    const validate = attendanceSchema.safeParse(raw);
    if (!validate.success) throw new Error("Invalid input data.");

    const { date, shift, staff_id } = validate.data;

    // Filter staff_id yang kosong
    const validStaffIds = staff_id.filter(
      (id) => id && id !== "null" && id !== "undefined",
    );

    if (validStaffIds.length === 0)
      throw new Error("Minimal satu staff harus dipilih.");

    // Hapus Record Lama
    const { error: deleteError } = await supabase
      .from("attendance")
      .delete()
      .eq("date", originalDate)
      .eq("shift", originalShift);

    if (deleteError) {
      throw new Error(`Failed to update attendance: ${deleteError.message}`);
    }

    // insert record baru
    const payload = validStaffIds.map((id) => ({
      date,
      shift,
      staff_id: id,
      is_demo: isGuest,
    }));

    const { error } = await supabase.from("attendance").insert(payload);
    if (error) {
      throw new Error(`Failed to update attendance: ${error.message}`);
    }

    revalidatePath(PATH);
    return { ok: true };
  });
}

// =========
// === DELETE ATTENDANCE ===
export async function deleteAttendance(compositeId: string) {
  return authAction(async ({ supabase }) => {
    if (!compositeId) throw new Error("Invalid Attendance Parameters.");
    const [date, shift] = compositeId.split("|");
    if (!date || !shift) throw new Error("Missing date or shift parameters.");
    const { error } = await supabase
      .from("attendance")
      .delete()
      .match({ date, shift });
    if (error) throw new Error(`Failed to delete attendance: ${error.message}`);
    revalidatePath("/attendance");
    return { ok: true };
  });
}
