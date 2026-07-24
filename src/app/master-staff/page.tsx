import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { QueryData } from "@supabase/supabase-js";
import * as z from "zod";

// COMP
import StaffClient from "./_components/staff-client";

// TYPE
import { staffSchema } from "./schema";
import { RoleSchema } from "../master-roles/schema";

export default async function StaffPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const staffQuery = supabase
    .from("staff")
    .select("id, staff_name, role_id, is_active, roles(role_name)")
    .order("roles(role_name)", { ascending: true })
    .order("staff_name", { ascending: true });

  const [staffRes, roleRes] = await Promise.all([
    staffQuery,
    supabase
      .from("roles")
      .select("role_name, id")
      .order("role_name", { ascending: true }),
  ]);

  // return message error
  if (staffRes.error) throw new Error("Failed to insert Staff.");
  if (roleRes.error) throw new Error("Failed to insert Staff.");

  type StaffWithRoles = QueryData<typeof staffQuery>;
  const rawStaffData: StaffWithRoles = staffRes.data ?? [];

  const staff = z.array(staffSchema).parse(rawStaffData);
  const roles = (roleRes.data ?? []) as RoleSchema[];

  return <StaffClient initialStaff={staff} initialRoles={roles} />;
}
