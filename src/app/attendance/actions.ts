"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { authAction } from "@/utils/action";
import { attendanceSchema } from "./schema";

export type AttendanceActionState = { error?: string; ok?: true };

const PATH = "/attendance";

const SHIFTS = ["Pagi", "Sore", "Malam"] as const;

// helper for auth check and guest user detection
async function getAuthContext(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthenticated");
  return {
    user,
    isGuest: user.email === "guest@rahayumedika.com",
  };
}

// fungsi validasi shift
function isValidShift(shift: string): shift is (typeof SHIFTS)[number] {
  return (SHIFTS as readonly string[]).includes(shift);
}

// ======
// === CREATE ATTENDANCE ===
export async function createAttendance(formData: unknown) {
  return authAction(async ({ supabase, isGuest }) => {
    const validate = attendanceSchema.safeParse(formData);
    if (!validate.success) throw new Error("Invalid input data.");

    const { date, shift, staffId } = validate.data;

    const payload = staffId
      .filter((id) => id && id !== "null" && id !== "undefined")
      .map((id) => ({
        date,
        shift,
        staffId: String(id),
        is_demo: isGuest,
      }));

    const { error } = await supabase.from("attendance").insert(payload);
    if (error)
      throw new Error(`Failed to create attendance: ${error.message}.`);

    revalidatePath(PATH);
    return { ok: true };
  });
}

// fungsi input absensi baru
// export async function createAttendance(
//   formData: FormData,
// ): Promise<AttendanceActionState> {
//   const supabase = await createClient();
//   const { isGuest } = await getAuthContext(supabase);
//   const data = {
//     date: String(formData.get("date") ?? "").trim(),
//     shift: String(formData.get("shift") ?? "").trim(),
//     staffId: (formData.getAll("staff_id") ?? []) as string[],
//     is_demo: isGuest,
//   };

//   if (!data.date) {
//     return { error: "Tanggal wajib diisi." };
//   }
//   if (!data.shift || !isValidShift(data.shift)) {
//     return { error: "Shift tidak valid." };
//   }

//   const payload = data.staffId
//     .filter((id) => id && id !== "null" && id !== "undefined")
//     .map((id) => ({
//       date: data.date,
//       shift: data.shift,
//       staff_id: String(id),
//       is_demo: data.is_demo,
//     }));

//   const { error } = await supabase.from("attendance").insert(payload);

//   if (error) return { error: error.message };

//   revalidatePath("/attendance");
//   return { ok: true };
// }

// fungsi update absensi
export async function updateAttendance(
  oldDate: string,
  oldShift: string,
  formData: FormData,
): Promise<AttendanceActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isGuest = user?.email === "guest@rahayumedika.com";
  const newDate = String(formData.get("date") ?? "").trim();
  const newShift = String(formData.get("shift") ?? "").trim();
  const staffIds = (formData.getAll("staff_id") ?? []) as string[];

  if (!newDate || !newShift || !isValidShift(newShift)) {
    return { error: "Tanggal dan shift baru wajib diisi dengan benar." };
  }

  const { error: deleteError } = await supabase
    .from("attendance")
    .delete()
    .match({ date: oldDate, shift: oldShift });

  if (deleteError) return { error: deleteError.message };

  const payload = staffIds
    .filter((id) => id && id !== "null" && id !== "undefined")
    .map((id) => ({
      date: newDate,
      shift: newShift,
      staff_id: id,
      is_demo: isGuest,
    }));

  const { error: insertError } = await supabase
    .from("attendance")
    .insert(payload);

  if (insertError) return { error: insertError.message };
  revalidatePath("/attendance");
  return { ok: true };
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
