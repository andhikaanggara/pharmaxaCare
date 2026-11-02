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

  const [patients, visits, staff, diagnoses, treatments, inpatients, otcSales] =
    await Promise.all([
      getPatients(),
      getVisitRows(range),
      getStaff(),
      getDiagnoses(),
      getTreatments(),
      getInpatientRows(),
      getOtcSales(range),
    ]);

  return (
    <VisitsClient
      patients={patients}
      visits={visits}
      staff={staff}
      diagnoses={diagnoses}
      treatments={treatments}
      inpatients={inpatients}
      otcSales={otcSales}
      range={range}
    />
  );
}
