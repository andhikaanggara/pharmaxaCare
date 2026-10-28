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
  renderPendaftaran,
  renderPerawat,
} from "./report-wa";
import { DutyEntry } from "@/app/visits/data";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function buildKpis(
  visits: VisitRow[],
  sales: OtcSaleRow[],
  inpatientCount: number,
) {
  const pays = visits.flatMap((v) => v.visit_payment ?? []);
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

export function buildCharts(visits: VisitRow[]) {
  const split = (key: (v: VisitRow) => string, names: string[]) =>
    names.map((name, i) => ({
      name,
      total: visits.filter((v) => key(v) === name).length,
      fill: `var(--chart-${i + 1})`,
    }));

  return {
    perDay: [
      ...countBy(visits, (v) => format(toDate(v.admission_date), "yyyy-MM-dd")),
    ]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, total]) => ({
        label: format(parseISO(d), "d MMM", { locale: idLocale }),
        total,
      })),
    shifts: SHIFTS.map((name) => ({
      name,
      total: visits.filter((v) => v.admission_shift === name).length,
    })),
    guarantor: split((v) => v.guarantor, ["Mandiri", "BPJS"]),
    department: split((v) => v.department, ["Umum", "Gigi"]),
    diagnoses: top(
      countBy(
        visits,
        (v) => v.diagnoses && `${v.diagnoses.code} ${v.diagnoses.name}`,
      ),
    ),
    treatments: top(
      countBy(
        visits.flatMap((v) => v.visit_treatments ?? []),
        (t) => t.treatments?.name,
      ),
    ),
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

export function staffPerformance(
  visits: VisitRow[],
  sales: OtcSaleRow[],
): StaffPerf[] {
  const map = new Map<string, StaffPerf>();
  const bump = (
    id: string | null | undefined,
    name: string | undefined,
    fn: (p: StaffPerf) => void,
  ) => {
    if (!id) return;
    let p = map.get(id);
    if (!p) {
      p = {
        id,
        name: name ?? "-",
        registered: 0,
        doctor: 0,
        nurse: 0,
        op: 0,
        asst: 0,
        rx: 0,
        trx: 0,
        total: 0,
      };
      map.set(id, p);
    }
    fn(p);
  };

  for (const v of visits) {
    bump(
      v.registration_staff_id,
      v.registration_staff?.name,
      (p) => p.registered++,
    );
    bump(v.doctor_staff_id, v.doctor?.name, (p) => p.doctor++);
    bump(v.nurse_staff_id, v.nurse?.name, (p) => p.nurse++);
    for (const t of v.visit_treatments ?? []) {
      bump(t.operator_staff_id, t.operator?.name, (p) => p.op++);
      bump(t.assistant_staff_id, t.assistant?.name, (p) => p.asst++);
    }
    for (const r of v.visit_prescription ?? []) {
      bump(r.pharmacist_staff_id, r.pharmacist?.name, (p) => p.rx++);
    }
    for (const y of v.visit_payment ?? []) {
      bump(y.cashier_staff_id, y.cashier?.name, (p) => {
        p.trx++;
        p.total += y.amount;
      });
    }
  }
  for (const s of sales) {
    bump(s.staff_id, s.staff?.name, (p) => {
      p.trx++;
      p.total += s.amount;
    });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export type ReportRole = "Pendaftaran" | "Perawat" | "Farmasi" | "Keuangan";

export function buildReport(
  role: ReportRole,
  visits: VisitRow[],
  sales: OtcSaleRow[],
  f: VisitFilters,
  pool: VisitRow[] = [],
  roster: DutyEntry[] = [],
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
    return { text: renderPendaftaran(visits, sales, f, pool, roster), warnings: warn };
  }
  if (role === "Perawat") {
    check((v) => !v.care, "kunjungan belum ada data tindakan");
    return { text: renderPerawat(visits, f, pool, roster), warnings: warn };
  }
  if (role === "Farmasi") {
    check(
      (v) => !!v.care && !isRoomCare(v.care) && !(v.visit_payment ?? []).length,
      "kunjungan rawat jalan belum ada pembayaran",
    );
    return { text: renderFarmasi(visits, f, pool, roster), warnings: warn };
  }
  const k = renderKeuangan(visits, sales, f, pool);
  return { text: k.text, warnings: [...warn, ...k.warnings] };
}
