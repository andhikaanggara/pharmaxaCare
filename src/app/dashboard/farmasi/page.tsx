import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import FarmasiClient from "./_components/farmasi-client";

export default async function FarmasiPage() {
  const supabase = await createClient();

  // Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch active staff data
  const { data: staffData } = await supabase
    .from("master_staff")
    .select("id, name, role")
    .eq("is_active", true);

  
  // Placeholder logic based on PRD
  const pendingVisits: any[] = [];
  const completedVisits: any[] = [];

  return (
    <FarmasiClient
      initialPending={pendingVisits}
      initialCompleted={completedVisits}
    />
  );
}
