import { format, isSameDay, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { SHIFTS, isRoomCare, type OtcSaleRow, type VisitRow } from "@/app/visits/schema";
import { toDate, type VisitFilters } from "@/app/visits/_components/filters-visit";
import { rupiah } from "@/app/visits/utils";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function buildKpis(visits: VisitRow[], sales: OtcSaleRow[], inpatientCount: number) {
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

const countBy = <T,>(items: T[], key: (x: T) => string | null | undefined) => {
  const m = new Map<string, number>();
  for (const i of items) {
    const k = key(i);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
};
const top = (m: Map<string, number>, n = 10) =>
  [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, total]) => ({ name, total }));

export function buildCharts(visits: VisitRow[]) {
  const split = (key: (v: VisitRow) => string, names: string[]) =>
    names.map((name, i) => ({
      name,
      total: visits.filter((v) => key(v) === name).length,
      fill: `var(--chart-${i + 1})`,
    }));

  return {
    perDay: [...countBy(visits, (v) => format(toDate(v.admission_date), "yyyy-MM-dd"))]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, total]) => ({ label: format(parseISO(d), "d MMM", { locale: idLocale }), total })),
    shifts: SHIFTS.map((name) => ({
      name,
      total: visits.filter((v) => v.admission_shift === name).length,
    })),
    guarantor: split((v) => v.guarantor, ["Mandiri", "BPJS"]),
    department: split((v) => v.department, ["Umum", "Gigi"]),
    diagnoses: top(countBy(visits, (v) => v.diagnoses && `${v.diagnoses.code} ${v.diagnoses.name}`)),
    treatments: top(countBy(visits.flatMap((v) => v.visit_treatments ?? []), (t) => t.treatments?.name)),
  };
}

export type StaffPerf = {
  id: string; name: string;
  registered: number; doctor: number; nurse: number;
  op: number; asst: number; rx: number; trx: number; total: number;
};

export function staffPerformance(visits: VisitRow[], sales: OtcSaleRow[]): StaffPerf[] {
  const map = new Map<string, StaffPerf>();
  const bump = (id: string | null | undefined, name: string | undefined, fn: (p: StaffPerf) => void) => {
    if (!id) return;
    let p = map.get(id);
    if (!p) {
      p = { id, name: name ?? "-", registered: 0, doctor: 0, nurse: 0, op: 0, asst: 0, rx: 0, trx: 0, total: 0 };
      map.set(id, p);
    }
    fn(p);
  };

  for (const v of visits) {
    bump(v.registration_staff_id, v.registration_staff?.name, (p) => p.registered++);
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
      bump(y.cashier_staff_id, y.cashier?.name, (p) => { p.trx++; p.total += y.amount; });
    }
  }
  for (const s of sales) {
    bump(s.staff_id, s.staff?.name, (p) => { p.trx++; p.total += s.amount; });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export type ReportRole = "Pendaftaran" | "Perawat" | "Farmasi";

export function buildReport(role: ReportRole, visits: VisitRow[], sales: OtcSaleRow[], f: VisitFilters) {
  const d = (x: Date) => format(x, "d MMM yyyy", { locale: idLocale });
  const range = !f.range?.from ? "Semua tanggal"
    : !f.range.to || isSameDay(f.range.from, f.range.to) ? d(f.range.from)
    : `${d(f.range.from)} - ${d(f.range.to)}`;

  const head = [`*Laporan ${role}*`, `Tanggal: ${range}`, `Shift: ${f.shift === "all" ? "Semua shift" : f.shift}`, ""];
  const warnings: string[] = [];
  let body: string[] = [];

  if (role === "Pendaftaran") {
    body = [
      `Total kunjungan: ${visits.length}`, "",
      ...visits.map((v, i) => `${i + 1}. ${v.patients?.name ?? "-"} | ${v.department} | ${v.guarantor}`),
    ];
    const n = visits.filter((v) => !v.registration_staff_id).length;
    if (n) warnings.push(`${n} kunjungan belum dilengkapi data pasiennya`);
  }

  if (role === "Perawat") {
    const rows = visits.flatMap((v) => v.visit_treatments ?? []);
    body = [
      `Total kunjungan: ${visits.length}`,
      `Total tindakan: ${rows.length}`, "",
      ...top(countBy(rows, (t) => t.treatments?.name), 50).map((t) => `- ${t.name} x${t.total}`),
    ];
    const n = visits.filter((v) => !v.care).length;
    if (n) warnings.push(`${n} kunjungan belum ada data tindakan`);
  }

  if (role === "Farmasi") {
    const rx = visits.flatMap((v) => v.visit_prescription ?? []);
    const k = buildKpis(visits, sales, 0);
    body = [
      `Resep: ${rx.length} (Regular ${rx.filter((r) => r.prescription_type === "Regular").length}, Racikan ${rx.filter((r) => r.prescription_type === "Racikan").length})`,
      `Pendapatan terbayar: ${rupiah.format(k.paid)}`,
      `Sisa tagihan: ${rupiah.format(k.outstanding)}`,
      `Penjualan apotek: ${k.otcCount} transaksi, ${rupiah.format(k.otc)}`,
    ];
    const n = visits.filter((v) => v.care && !isRoomCare(v.care) && !(v.visit_payment ?? []).length).length;
    if (n) warnings.push(`${n} kunjungan rawat jalan belum ada pembayaran`);
  }

  return { text: [...head, ...body].join("\n"), warnings };
}