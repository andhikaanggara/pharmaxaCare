"use server";

import { revalidatePath } from "next/cache";
import { authAction } from "@/utils/action";
import { staffSchema } from "./schema";

const PATH = "/master-staff";

// ======
// --- CREATE STAFF ---
export async function createStaff(formData: unknown) {
  return authAction(async ({ supabase, isGuest }) => {
    const validate = staffSchema.safeParse(formData);
    if (!validate.success) throw new Error("Invalid input data.");

    const { staff_name, role_id, is_active } = validate.data;

    const { error } = await supabase.from("staff").insert({
      staff_name: staff_name.trim(),
      role_id,
      is_active,
      is_demo: isGuest,
    });

    if (error) throw new Error(`Failed to create staff: ${error.message}`);

    revalidatePath(PATH);
    return { ok: true };
  });
}

// ======
// --- UPDATE STAFF ---
export async function updateStaff(formData: unknown) {
  return authAction(async ({ supabase }) => {
    const validate = staffSchema.safeParse(formData);
    if (!validate.success) throw new Error("Invalid input data.");

    const { id, staff_name, role_id, is_active } = validate.data;
    if (!id) throw new Error("Invalid Staff ID.");

    const { error } = await supabase
      .from("staff")
      .update({
        staff_name: staff_name.trim(),
        role_id,
        is_active,
      })
      .eq("id", id);

    if (error) throw new Error(`Failed to update staff: ${error.message}.`);

    revalidatePath(PATH);
    return { ok: true };
  });
}

// ======
// --- DELETE STAFF ---
export async function deleteStaff(id: string) {
  return authAction(async ({ supabase }) => {
    if (!id) throw new Error("Invalid Staff ID.");

    const { error } = await supabase.from("staff").delete().eq("id", id);

    if (error) throw new Error(`Failed to delete staff: ${error.message}`);

    revalidatePath(PATH);
    return { ok: true };
  });
}
