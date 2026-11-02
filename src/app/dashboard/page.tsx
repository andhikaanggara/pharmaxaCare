import {
  getDutyRoster,
  getInpatientRows,
  getOtcSales,
  getStaff,
  getVisitRows,
} from "@/app/visits/data";
import DashboardSummary from "./_components/dashboard-summary";
import { payrollPeriod, rangeFromParams, todayYmd } from "@/lib/periods";
import { getMonthlyChartData, getStaffPerformance } from "./data";
import { getCashEntries } from "./cash-data";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    period?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const sp = await searchParams;
  const range = rangeFromParams(sp);
  const today = todayYmd();
  const monthDay = /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month ?? "")
    ? `${sp.month}-01`
    : today;
  const periodDay = /^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(sp.period ?? "")
    ? sp.period!
    : today;

  const [
    visits,
    otcSales,
    inpatients,
    roster,
    monthly,
    staffPerf,
    cashEntries,
    staff,
  ] = await Promise.all([
    getVisitRows(range),
    getOtcSales(range),
    getInpatientRows(),
    getDutyRoster(),
    getMonthlyChartData(monthDay),
    getStaffPerformance(periodDay),
    getCashEntries(),
    getStaff(),
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
      cashEntries={cashEntries}
      staff={staff}
      range={range}
    />
  );
}
