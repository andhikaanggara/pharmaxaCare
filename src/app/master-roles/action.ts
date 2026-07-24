"use server";

import { revalidatePath } from "next/cache";
import { authAction } from "@/utils/action";
import { roleSchema, RoleSchema } from "./schema";

const PATH = "/master-roles";

// ==========
// == CREATE ROLE ==
export async function createRole(formData: unknown) {
  return authAction(async ({ supabase, isGuest }) => {
    const validate = roleSchema.safeParse(formData);
    if (!validate.success) throw new Error("Invalid input data.");

    const { role_name, is_active } = validate.data;
    const { error } = await supabase.from("roles").insert({
      role_name: role_name.trim(),
      is_active,
      is_demo: isGuest,
    });
    if (error) throw new Error(`Failed to create role: ${error.message}`);
    revalidatePath(PATH);
    return { ok: true };
  });
}

// ==========
// == UPDATE ROLE ==
export async function updateRole(formData: unknown) {
  return authAction(async ({ supabase }) => {
    const validate = roleSchema.safeParse(formData);
    if (!validate.success) throw new Error("Invalid input data.");

    const { id, role_name, is_active } = validate.data;
    if (!id) throw new Error("Invalid Role ID.");

    const { error } = await supabase
      .from("roles")
      .update({
        role_name: role_name.trim(),
        is_active,
      })
      .eq("id", id);

    if (error) throw new Error(`Failed to update role: ${error.message}.`);
    revalidatePath(PATH);
    return { ok: true };
  });
}

// ==========
// == DELETE ROLE ==
export async function deleteRole(id: string) {
  return authAction(async ({ supabase }) => {
    if (!id) throw new Error("Invalid Role ID.");

    const { error } = await supabase.from("roles").delete().eq("id", id);
    if (error) throw new Error(`Failed to delete role: ${error.message}`);

    revalidatePath(PATH);
    return { ok: true };
  });
}