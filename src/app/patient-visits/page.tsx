import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

//  type
import { StaffSchema } from "../master-staff/schema";
import { QueryData } from "@supabase/supabase-js";
import VisitSClient from "./_componenets/visits-client";

export const dynamic = "force-dynamic";

// fetching data attendance, staff, and role
export default async function PatientVisitsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const visitsQuery = supabase
    .from("visits")
    .select(
      "id, date, shift, patient_id, poly, recipe, payment, payment_methode, create_by, patients(patient_name, mr_number, gender, birth_date, address)",
    );

  const [staffRes, patientRes, treatmentRes, visitsRes] = await Promise.all([
    supabase
      .from("staff")
      .select("id, staff_name, role_id, is_active")
      .order("staff_name", { ascending: true }),
    supabase
      .from("patients")
      .select("id, patient_name, gender, mr_number, address, birth_date")
      .order("patient_name", { ascending: true }),
    supabase
      .from("treatments")
      .select("id, treatment_name")
      .order("treatment_name", { ascending: true }),
    visitsQuery,
  ]);

  // return message error

  if (visitsRes.error) throw new Error("Failed to insert Visits");

  type VisitsWithPatient = QueryData<typeof visitsQuery>;
  const rawVisistsData: VisitsWithPatient = visitsRes.data ?? [];

  const staff = (staffRes.data ?? []) as StaffSchema[];
  const patients = patientRes.data ?? [];
  const treatments = treatmentRes.data ?? [];
  const visits = (visitsRes.data ?? []) as VisitsWithPatient;

  return (
    <VisitSClient
      initialStaff={staff}
      patientList={patients}
      treatments={treatments}
      visitsList={visits}
    />
  );
}
