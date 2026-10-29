import { format, isSameDay, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  SHIFTS,
  isRoomCare,
  type OtcSaleRow,
  type VisitRow,
} from "@/app/visits/schema";
import {
  toDate,
  type VisitFilters,
} from "@/app/visits/_components/filters-visit";
import { rupiah } from "@/app/visits/utils";
import {
  renderFarmasi,
  renderKeuangan,
  renderMakan,
  renderPendaftaran,
  renderPerawat,
} from "./report-wa";
import { DutyEntry } from "@/app/visits/data";
import { CashSummary } from "@/lib/cash-shared";
import { elapsedDays, monthLabel, todayYmd, wibDay } from "@/lib/periods";
import { MonthlyChartData } from "../data";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function buildKpis(
  visits: VisitRow[],
  sales: OtcSaleRow[],
  inpatientCount: number,
) {
  const pays = visits
    .filter((v) => v.guarantor !== "BPJS")
    .flatMap((v) => v.visit_payment ?? []);
  return {
    total: visits.length,
    longStay: visits.filter((v) => isRoomCare(v.care)).length,
    inpatients: inpatientCount,
    paid: sum(pays.map((p) => p.amount)),
    payCount: pays.length,
    outstanding: sum(pays.map((p) => Math.max(p.billed_amount - p.amount, 0))),
    unpaid: pays.filter((p) => p.billed_amount > p.amount).length,
    otc: sum(sales.map((s) => s.amount)),
    otcCount: sales.length,
    treatments: visits.flatMap((v) => v.visit_treatments ?? []).length,
  };
}

const countBy = <T>(items: T[], key: (x: T) => string | null | undefined) => {
  const m = new Map<string, number>();
  for (const i of items) {
    const k = key(i);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
};
const top = (m: Map<string, number>, n = 10) =>
  [...m]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, total]) => ({ name, total }));

export function buildMonthlyCharts(d: MonthlyChartData) {
  const today = todayYmd();
  const lastDay = today.startsWith(d.month)
    ? Number(today.slice(8, 10))
    : d.days;
  const perDay = countBy(d.visits, (v) => wibDay(v.admission_date));
  const divisor = elapsedDays(d.month, d.days, today);

  const split = (
    key: (v: MonthlyChartData["visits"][number]) => string,
    names: string[],
  ) =>
    names.map((name, i) => ({
      name,
      total: d.visits.filter((v) => key(v) === name).length,
      fill: `var(--chart-${i + 1})`,
    }));

  return {
    total: d.visits.length,
    monthLabel: monthLabel(d.month),
    perDay: Array.from({ length: lastDay }, (_, i) => ({
      label: String(i + 1),
      total: perDay.get(`${d.month}-${String(i + 1).padStart(2, "0")}`) ?? 0,
    })),
    // rata-rata per hari = total shift / jumlah hari berjalan
    shifts: SHIFTS.map((name) => ({
      name,
      total:
        Math.round(
          (d.visits.filter((v) => v.admission_shift === name).length /
            divisor) *
            10,
        ) / 10,
    })),
    guarantor: split((v) => v.guarantor, ["Mandiri", "BPJS"]),
    department: split((v) => v.department, ["Umum", "Gigi"]),
    diagnoses: top(
      countBy(
        d.visits,
        (v) => v.diagnoses && `${v.diagnoses.code} ${v.diagnoses.name}`,
      ),
    ),
    treatments: top(countBy(d.treatmentNames, (n) => n)),
  };
}

export type StaffPerf = {
  id: string;
  name: string;
  registered: number;
  doctor: number;
  nurse: number;
  op: number;
  asst: number;
  rx: number;
  trx: number;
  total: number;
};

export type ReportRole =
  | "Pendaftaran"
  | "Perawat"
  | "Farmasi"
  | "Keuangan"
  | "Makan";

export function buildReport(
  role: ReportRole,
  visits: VisitRow[],
  sales: OtcSaleRow[],
  VisitFilters: VisitFilters,
  pool: VisitRow[] = [],
  roster: DutyEntry[] = [],
  inpatients: VisitRow[] = [],
  cash: CashSummary | null = null,
) {
  const warn: string[] = [];
  const check = (fn: (v: VisitRow) => boolean, msg: string) => {
    const n = visits.filter(fn).length;
    if (n) warn.push(`${n} ${msg}`);
  };

  if (role === "Pendaftaran") {
    check(
      (v) => !v.registration_staff_id,
      "kunjungan belum dilengkapi data pasiennya",
    );
    warn.push(
      "Petugas hari berikutnya belum diisi (isi manual sebelum dikirim)",
    );
    return {
      text: renderPendaftaran(visits, sales, VisitFilters, pool, roster),
      warnings: warn,
    };
  }
  if (role === "Perawat") {
    check((v) => !v.care, "kunjungan belum ada data tindakan");
    return {
      text: renderPerawat(visits, VisitFilters, pool, roster),
      warnings: warn,
    };
  }
  if (role === "Farmasi") {
    check(
      (v) => !!v.care && !isRoomCare(v.care) && !(v.visit_payment ?? []).length,
      "kunjungan rawat jalan belum ada pembayaran",
    );
    return {
      text: renderFarmasi(visits, VisitFilters, pool, roster),
      warnings: warn,
    };
  }
  if (role === "Makan") {
    return { text: renderMakan(inpatients), warnings: warn };
  }
  const k = renderKeuangan(visits, sales, VisitFilters, pool);
  return { text: k.text, warnings: [...warn, ...k.warnings] };
}
