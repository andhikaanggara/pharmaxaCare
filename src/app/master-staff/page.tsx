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
    .select("id, name, role_id, is_active, roles(name)")
    .order("roles(name)", { ascending: true })
    .order("name", { ascending: true });

  const [staffRes, roleRes] = await Promise.all([
    staffQuery,
    supabase
      .from("roles")
      .select("name, id")
      .order("name", { ascending: true }),
  ]);

  // return message error
  if (staffRes.error)
    throw new Error(`Gagal memuat Staff: ${staffRes.error.message}`);
  if (roleRes.error)
    throw new Error(`Gagal memuat Roles: ${roleRes.error.message}`);

  const rawStaffData = (staffRes.data ?? []).map((item) => ({
    ...item,
    roles: item.roles ? item.roles : undefined,
  }));

  const parsedStaff = z.array(staffSchema).parse(rawStaffData);
  const roles = (roleRes.data ?? []) as RoleSchema[];

  const staff = z.array(staffSchema).parse(rawStaffData);

  return <StaffClient initialStaff={parsedStaff} initialRoles={roles} />;
}
