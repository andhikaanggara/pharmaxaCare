import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";

// component
import AttendanceClient from "@/app/attendance/_components/attendance-client";
import { DataErrorState } from "@/components/feedback/data-error-state";

//  type
import { AttendanceSchema } from "./_components/schema";
import { RoleSchema } from "../master-roles/schema";
import { StaffSchema } from "../master-staff/schema";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ from?: string; to?: string }>;
};

function getDefaultCutoffDates() {
  const today = new Date();
  const currentDay = today.getDate();

  let startDate: Date;
  let endDate: Date;

  if (currentDay >= 28) {
    // Jika tanggal >= 28, periode dari tgl 28 bulan ini s/d tgl 27 bulan depan
    startDate = new Date(today.getFullYear(), today.getMonth(), 28);
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 27);
  } else {
    // Jika tanggal < 28, periode dari tgl 28 bulan lalu s/d tgl 27 bulan ini
    startDate = new Date(today.getFullYear(), today.getMonth() - 1, 28);
    endDate = new Date(today.getFullYear(), today.getMonth(), 27);
  }

  return {
    from: format(startDate, "yyyy-MM-dd"),
    to: format(endDate, "yyyy-MM-dd"),
  };
}

// fetching data attendance, staff, and role
export default async function AttendancePage({ searchParams }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const defaults = getDefaultCutoffDates();

  const startDateParam = params.from || defaults.from;
  const endDateParam = params.to || defaults.to;

  const [attendanceRes, staffRes, roleRes] = await Promise.all([
    supabase
      .from("attendance")
      .select("id, date, shift, staff_id, staff(staff_name)")
      .gte("date", startDateParam)
      .lte("date", endDateParam)
      .order("date", { ascending: false }),
    supabase
      .from("staff")
      .select("id, staff_name, role_id, is_active, roles(role_name)")
      .order("staff_name", { ascending: true }),
    supabase
      .from("roles")
      .select("role_name")
      .order("role_name", { ascending: true }),
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
        columns={["id", "staff_name", "role", "is_active"]}
      />
    );
  }

  if (attendanceRes.error) {
    return (
      <DataErrorState
        title="Manajement Absensi"
        message={attendanceRes.error.message}
        tableName="attendance"
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
      defaultRange={{
        from: new Date(startDateParam),
        to: new Date(endDateParam),
      }}
    />
  );
}
