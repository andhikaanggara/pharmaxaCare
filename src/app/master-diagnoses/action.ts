"use server";

import { revalidatePath } from "next/cache";
import { authAction } from "@/utils/action";
import { diagnosisSchema } from "./schema";

const PATH = "/dashboard/diagnoses";

// ==========
// == CREATE DIAGNOSIS ==
export async function createDiagnosis(formData: unknown) {
  return authAction(async ({ supabase }) => {
    const validate = diagnosisSchema.safeParse(formData);
    if (!validate.success) throw new Error("Invalid input data.");

    const { code, name } = validate.data;
    const { data, error } = await supabase
      .from("diagnoses")
      .insert({
        code: code.trim().toUpperCase(),
        name: name.trim(),
      })
      .select("id, code, name")
      .single();

    if (error) throw new Error(`Failed to create diagnosis: ${error.message}`);
    revalidatePath(PATH);
    return data;
  });
}

// ==========
// == UPDATE DIAGNOSIS ==
export async function updateDiagnosis(formData: unknown) {
  return authAction(async ({ supabase }) => {
    const validate = diagnosisSchema.safeParse(formData);
    if (!validate.success) throw new Error("Invalid input data.");

    const { id, code, name } = validate.data;
    if (!id) throw new Error("Invalid Diagnosis ID.");

    const { data, error } = await supabase
      .from("diagnoses")
      .update({
        code: code.trim().toUpperCase(),
        name: name.trim(),
      })
      .eq("id", id)
      .select("id, code, name")
      .single();

    if (error) throw new Error(`Failed to update diagnosis: ${error.message}.`);
    revalidatePath(PATH);
    return data;
  });
}

// ==========
// == DELETE DIAGNOSIS ==
export async function deleteDiagnosis(id: string) {
  return authAction(async ({ supabase }) => {
    if (!id) throw new Error("Invalid Diagnosis ID.");

    const { error } = await supabase.from("diagnoses").delete().eq("id", id);
    if (error) throw new Error(`Failed to delete diagnosis: ${error.message}`);

    revalidatePath(PATH);
    return { ok: true };
  });
}
