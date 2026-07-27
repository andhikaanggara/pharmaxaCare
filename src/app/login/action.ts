"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const direct = "/attendance";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return { error: error.message };
  }
  redirect(direct);
}

// fuction handle guest login
export async function guestLoginAction() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: "guest@rahayumedika.com",
    password: "password123",
  });
  if (error) {
    return { error: error.message };
  }
  redirect(direct);
}
