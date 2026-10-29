import {
  getDutyRoster,
  getInpatientRows,
  getOtcSales,
  getVisitRows,
} from "@/app/visits/data";
import DashboardSummary from "./_components/dashboard-summary";
import { payrollPeriod, todayYmd } from "@/lib/periods";
import { getMonthlyChartData, getStaffPerformance } from "./data";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; period?: string }>;
}) {
  const sp = await searchParams;
  const today = todayYmd();
  const monthDay = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month ?? "")
    ? `${sp.month}-01`
    : today;
  const periodDay = /^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(sp.period ?? "")
    ? sp.period!
    : today;

  const [visits, otcSales, inpatients, roster, monthly, staffPerf] =
    await Promise.all([
      getVisitRows(),
      getOtcSales(),
      getInpatientRows(),
      getDutyRoster(),
      getMonthlyChartData(monthDay),
      getStaffPerformance(periodDay),
    ]);
  return (
    <DashboardSummary
      visits={visits}
      otcSales={otcSales}
      inpatients={inpatients}
      roster={roster}
      monthly={monthly}
      staffPerf={staffPerf}
      periodStart={payrollPeriod(periodDay).start}
    />
  );
}
