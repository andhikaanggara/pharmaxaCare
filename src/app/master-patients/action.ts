"use server";

import { revalidatePath } from "next/cache";
import { authAction } from "@/utils/action";
import { patientSchema } from "./schema";

const PATH = "/master-patient";

// =====
// == CREATE PATIENT ==
export async function createPatient(formData: unknown) {
  return authAction(async ({ supabase, isGuest }) => {
    const validate = patientSchema.safeParse(formData);
    if (!validate.success) throw new Error("Invalid input data.");

    const { patient_name, mr_number, gender, birth_date, phone, address } =
      validate.data;

    const { error } = await supabase.from("patients").insert({
      patient_name: patient_name.trim(),
      mr_number: mr_number.trim(),
      gender: gender.trim(),
      birth_date: birth_date.trim(),
      phone: phone.trim(),
      address: address.trim(),
      is_demo: isGuest,
    });
    if (error) throw new Error(`Failed to create patient: ${error.message}`);
    revalidatePath(PATH);
    return { ok: true };
  });
}

// ======
// == UPDATE PATIENT ==
export async function updatePatient(formData: unknown) {
  return authAction(async ({ supabase }) => {
    const validate = patientSchema.safeParse(formData);
    if (!validate.success) throw new Error("Invalid input data.");

    const { id, patient_name, mr_number, gender, birth_date, phone, address } =
      validate.data;
    if (!id) throw new Error("Invalid Patient ID.");

    const { error } = await supabase
      .from("patients")
      .update({
        patient_name: patient_name.trim(),
        mr_number: mr_number.trim(),
        gender: gender.trim(),
        birth_date: birth_date.trim(),
        phone: phone.trim(),
        address: address.trim(),
      })
      .eq("id", id);
    if (error) throw new Error(`Failed to update patient: ${error.message}.`);
    revalidatePath(PATH);
    return { ok: true };
  });
}

// ======
// == DELETE PATIENT ==
export async function deletePatient(id: string) {
  return authAction(async ({ supabase }) => {
    if (!id) throw new Error("Invalid Patient ID.");

    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) throw new Error(`Failed to delete patient: ${error.message}`);
    revalidatePath(PATH);
    return { ok: true };
  });
}
