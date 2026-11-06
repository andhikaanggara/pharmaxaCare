import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import VisitsClient from "./_components/visits-client";
import {
  getDiagnoses,
  getInpatientRows,
  getOtcSales,
  getPatients,
  getStaff,
  getTreatments,
  getVisitRows,
} from "./data";
import { rangeFromParams } from "@/lib/periods";

export default async function VisitsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const range = rangeFromParams(await searchParams);

  // Auth guard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [patients, staff, diagnoses, treatments, visits, inpatients, otcSales] =
    await Promise.all([
      getPatients(),
      getStaff(),
      getDiagnoses(),
      getTreatments(),
      getVisitRows(range),
      getInpatientRows(),
      getOtcSales(range),
    ]);

  return (
    <VisitsClient
      patients={patients}
      staff={staff}
      diagnoses={diagnoses}
      treatments={treatments}
      visits={visits}
      inpatients={inpatients}
      otcSales={otcSales}
      range={range}
    />
  );
}
