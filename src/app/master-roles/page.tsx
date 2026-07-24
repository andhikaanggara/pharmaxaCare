import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import RolesClient from "./_components/roles-client";

export default async function RolesPage() {
  const supabase = await createClient();

  // auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // fetch data
  const { data, error } = await supabase
    .from("roles")
    .select("id, role_name, is_active")
    .order("role_name", { ascending: true });

  if (error) throw new Error("Failed to insert Staff.");

  return <RolesClient initialRoles={data} />;
}
