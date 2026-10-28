import {
  getDutyRoster,
  getInpatientRows,
  getOtcSales,
  getVisitRows,
} from "@/app/visits/data";
import DashboardSummary from "./_components/dashboard-summary";

export default async function DashboardPage() {
  const [visits, otcSales, inpatients] = await Promise.all([
    getVisitRows(),
    getOtcSales(),
    getInpatientRows(),
  ]);
  const roster = await getDutyRoster();
  return (
    <DashboardSummary
      visits={visits}
      otcSales={otcSales}
      inpatients={inpatients}
      roster={roster}
    />
  );
}
