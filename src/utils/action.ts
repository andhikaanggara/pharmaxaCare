"use server";

import { createClient } from "./supabase/server";
import { SupabaseClient, User } from "@supabase/supabase-js";

export type ActionState<T> =
  | { ok: true; data: T }
  | { ok?: false; error: string };

export async function getAuthContext(supabase: SupabaseClient) {
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

export async function authAction<T>(
  actionFn: (context: {
    supabase: SupabaseClient;
    user: User;
    isGuest: boolean;
  }) => Promise<T>,
): Promise<ActionState<T>> {
  try {
    const supabase = await createClient();
    const { user, isGuest } = await getAuthContext(supabase);
    const data = await actionFn({ supabase, user, isGuest });
    return { ok: true, data };
  } catch (err: any) {
    return { error: err.message || "Terjadi kesalahan internal" };
  }
}
