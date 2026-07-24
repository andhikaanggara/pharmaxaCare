import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// COMP
import TreatmentsClient from "./_components/treatments-client";

export default async function TreatmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("treatments")
    .select("id, treatment_name")
    .order("treatment_name", { ascending: true });
  if (error) throw new Error("Failed to insert treatment.");

  return <TreatmentsClient initialData={data ?? []} />;
}
