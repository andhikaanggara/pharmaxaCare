import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DiagnosesClient from "./_components/diagnoses-client";

export default async function MasterDiagnosesPage() {
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
    .from("diagnoses")
    .select("id, code, name")
    .order("code", { ascending: true });

  if (error) {
    // In a real app, you might want more sophisticated error handling
    console.error(error);
  }

  return <DiagnosesClient initialDiagnoses={data || []} />;
}
