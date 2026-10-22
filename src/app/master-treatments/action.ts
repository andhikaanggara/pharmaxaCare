"use server";

import { authAction } from "@/utils/action";
import { treatmentSchema } from "./schema";
import { revalidatePath } from "next/cache";

const PATH = "/master-treatments";

// ======
// == CREATE TREATMENT ==
export async function createTreatment(formData: unknown) {
  return authAction(async ({ supabase, isGuest }) => {
    const validate = treatmentSchema.safeParse(formData);
    if (!validate.success) throw new Error("Invalid input data.");

    const { name } = validate.data;

    const { data, error } = await supabase
      .from("treatments")
      .insert({
        name: name.trim(),
        is_demo: isGuest,
      })
      .select("id, name")
      .single();

    if (error) throw new Error(`Failed to create treatment: ${error.message}.`);
    revalidatePath(PATH);
    return data;
  });
}

// ======
// == UPDATE TREATMENT ==
export async function updateTreatment(formData: unknown) {
  return authAction(async ({ supabase }) => {
    const validate = treatmentSchema.safeParse(formData);
    if (!validate.success) throw new Error("Invalid input data.");

    const { id, name } = validate.data;
    if (!id) throw new Error("Invalid Treatment ID");

    const { data, error } = await supabase
      .from("treatments")
      .update({ name: name.trim() })
      .eq("id", id)
      .select("id, name")
      .single();

    if (error) throw new Error(`Failed to update treatment: ${error.message}`);
    revalidatePath(PATH);
    return data;
  });
}

// ======
// == DELETE TREATMENT ==
export async function deleteTreatment(id: string) {
  return authAction(async ({ supabase }) => {
    if (!id) throw new Error("Invalid Treatment ID.");

    const { error } = await supabase.from("treatments").delete().eq("id", id);
    if (error) throw new Error(`Failed to delete treatment: ${error.message}`);
    revalidatePath(PATH);
    return { ok: true };
  });
}
