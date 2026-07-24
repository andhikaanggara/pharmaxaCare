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

    const { treatment_name } = validate.data;

    const { error } = await supabase.from("treatments").insert({
      treatment_name: treatment_name.trim(),
      is_demo: isGuest,
    });
    if (error) throw new Error(`Failed to create treatment: ${error.message}.`);

    revalidatePath(PATH);
    return { ok: true };
  });
}

// ======
// == UPDATE TREATMENT ==
export async function updateTreatment(formData: unknown) {
  return authAction(async ({ supabase }) => {
    const validate = treatmentSchema.safeParse(formData);
    if (!validate.success) throw new Error("Invalid input data.");

    const { id, treatment_name } = validate.data;
    if (!id) throw new Error("Invalid Treatment ID");

    const { error } = await supabase
      .from("treatments")
      .update({
        treatment_name: treatment_name.trim(),
      })
      .eq("id", id);
    if (error) throw new Error(`Failed to update treatment: ${error.message}`);
    revalidatePath(PATH);
    return { ok: true };
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
