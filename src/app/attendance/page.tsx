import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// component
import AttendanceClient from "@/app/attendance/_components/attendance-client";
import { DataErrorState } from "@/components/feedback/data-error-state";

//  type
import { AttendanceSchema } from "./_components/schema";
import { RoleSchema } from "../master-roles/schema";
import { StaffSchema } from "../master-staff/schema";

export const dynamic = "force-dynamic";

// fetching data attendance, staff, and role
export default async function AttendancePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [attendanceRes, staffRes, roleRes] = await Promise.all([
    supabase
      .from("attendances")
      .select("id, date, shift, staff_id")
      .order("date", { ascending: false }),
    supabase
      .from("staff")
      .select("id, name, role_id, is_active, roles(name)")
      .order("name", { ascending: true }),
    supabase.from("roles").select("name").order("name", { ascending: false }),
  ]);

  // return message error
  if (roleRes.error) {
    return (
      <DataErrorState
        title="Manajement Peran"
        message={roleRes.error.message}
        tableName="roles"
        columns={["role"]}
      />
    );
  }

  if (staffRes.error) {
    return (
      <DataErrorState
        title="Manajement Petugas"
        message={staffRes.error.message}
        tableName="staff"
        columns={["id", "name", "role", "is_active"]}
      />
    );
  }

  if (attendanceRes.error) {
    return (
      <DataErrorState
        title="Manajement Absensi"
        message={attendanceRes.error.message}
        tableName="attendances"
        columns={["id", "date", "shift", "staff_id"]}
      />
    );
  }

  const roles = (roleRes.data ?? []) as RoleSchema[];
  const staff = ((staffRes.data as any) ?? []) as StaffSchema[];
  const rows = ((attendanceRes.data as any) ?? []) as AttendanceSchema[];

  return (
    <AttendanceClient
      initialAttendance={rows}
      staffList={staff}
      roles={roles}
    />
  );
}
