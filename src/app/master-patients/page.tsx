import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// UI COMP
import PatientsClient from "./_components/patients-client";

// TYPE
import { PatientSchema } from "./schema";

export default async function PatientsPage() {
  const supabase = await createClient();

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("patients")
    .select("id, patient_name, mr_number, gender, birth_date, phone, address")
    .order("patient_name", { ascending: true });
  if (error) throw new Error("Failed to insert Patient.");

  const patients = (data ?? []) as PatientSchema[];

  return <PatientsClient initialPatients={patients} />;
}
