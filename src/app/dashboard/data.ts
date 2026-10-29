"use server";

import { createClient } from "@/utils/supabase/server";
import { monthRange, payrollPeriod, wibStart } from "@/lib/periods";
import type { StaffPerf } from "./_components/dashboard-data";

type Page = PromiseLike<{
  data: unknown[] | null;
  error: { message: string } | null;
}>;

async function fetchAll<T>(
  build: (from: number, to: number) => Page,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as T[]));
    if ((data ?? []).length < 1000) break;
  }
  return out;
}

export type MonthlyChartData = {
  month: string;
  days: number;
  visits: {
    admission_date: string;
    admission_shift: string;
    guarantor: string;
    department: string;
    diagnoses: { code: string; name: string } | null;
  }[];
  treatmentNames: string[];
};

/** Data 5 grafik: satu bulan kalender dari hari yang diberikan */
export async function getMonthlyChartData(
  day: string,
): Promise<MonthlyChartData> {
  const supabase = await createClient();
  const m = monthRange(day);

  const [visits, treatments] = await Promise.all([
    fetchAll<MonthlyChartData["visits"][number]>((a, b) =>
      supabase
        .from("visits")
        .select(
          "admission_date, admission_shift, guarantor, department, diagnoses!diagnoses_id ( code, name )",
        )
        .gte("admission_date", wibStart(m.start))
        .lt("admission_date", wibStart(m.endExclusive))
        .order("id")
        .range(a, b),
    ),
    // tindakan dihitung menurut tanggal tindakannya sendiri
    fetchAll<{ treatments: { name: string } | null }>((a, b) =>
      supabase
        .from("visit_treatments")
        .select("treatments ( name )")
        .gte("treatment_date", m.start)
        .lt("treatment_date", m.endExclusive)
        .order("id")
        .range(a, b),
    ),
  ]);

  return {
    month: m.key,
    days: m.days,
    visits,
    treatmentNames: treatments.flatMap((t) =>
      t.treatments?.name ? [t.treatments.name] : [],
    ),
  };
}

/** Performa staf: satu periode gaji (28 s.d. 27) yang memuat hari yang diberikan */
export async function getStaffPerformance(day: string): Promise<StaffPerf[]> {
  const supabase = await createClient();
  const p = payrollPeriod(day);
  const inRange = (col: string) => [col, p.start, p.endExclusive] as const;

  const [visits, tx, rx, pay, otc, staff] = await Promise.all([
    // pendaftaran, dokter, perawat penanggung jawab: menurut tanggal kunjungan
    fetchAll<{
      registration_staff_id: string | null;
      doctor_staff_id: string | null;
      nurse_staff_id: string | null;
    }>((a, b) =>
      supabase
        .from("visits")
        .select("registration_staff_id, doctor_staff_id, nurse_staff_id")
        .gte("admission_date", wibStart(p.start))
        .lt("admission_date", wibStart(p.endExclusive))
        .order("id")
        .range(a, b),
    ),
    fetchAll<{
      operator_staff_id: string | null;
      assistant_staff_id: string | null;
    }>((a, b) =>
      supabase
        .from("visit_treatments")
        .select("operator_staff_id, assistant_staff_id")
        .gte(...(inRange("treatment_date").slice(0, 2) as [string, string]))
        .lt("treatment_date", p.endExclusive)
        .order("id")
        .range(a, b),
    ),
    fetchAll<{ pharmacist_staff_id: string | null }>((a, b) =>
      supabase
        .from("visit_prescriptions")
        .select("pharmacist_staff_id")
        .gte("prescription_date", p.start)
        .lt("prescription_date", p.endExclusive)
        .order("id")
        .range(a, b),
    ),
    fetchAll<{ cashier_staff_id: string | null; amount: number }>((a, b) =>
      supabase
        .from("visit_payments")
        .select("cashier_staff_id, amount")
        .gte("payment_date", p.start)
        .lt("payment_date", p.endExclusive)
        .order("id")
        .range(a, b),
    ),
    fetchAll<{ staff_id: string | null; amount: number }>((a, b) =>
      supabase
        .from("otc_sales")
        .select("staff_id, amount")
        .gte("sale_date", p.start)
        .lt("sale_date", p.endExclusive)
        .order("id")
        .range(a, b),
    ),
    fetchAll<{ id: string; name: string }>((a, b) =>
      supabase.from("staff").select("id, name").order("id").range(a, b),
    ),
  ]);

  const names = new Map(staff.map((s) => [s.id, s.name]));
  const map = new Map<string, StaffPerf>();
  const bump = (id: string | null, fn: (x: StaffPerf) => void) => {
    if (!id) return;
    let x = map.get(id);
    if (!x) {
      x = {
        id,
        name: names.get(id) ?? "-",
        registered: 0,
        doctor: 0,
        nurse: 0,
        op: 0,
        asst: 0,
        rx: 0,
        trx: 0,
        total: 0,
      };
      map.set(id, x);
    }
    fn(x);
  };

  for (const v of visits) {
    bump(v.registration_staff_id, (x) => x.registered++);
    bump(v.doctor_staff_id, (x) => x.doctor++);
    bump(v.nurse_staff_id, (x) => x.nurse++);
  }
  for (const t of tx) {
    bump(t.operator_staff_id, (x) => x.op++);
    bump(t.assistant_staff_id, (x) => x.asst++);
  }
  for (const r of rx) bump(r.pharmacist_staff_id, (x) => x.rx++);
  for (const y of pay)
    bump(y.cashier_staff_id, (x) => {
      x.trx++;
      x.total += y.amount;
    });
  for (const s of otc)
    bump(s.staff_id, (x) => {
      x.trx++;
      x.total += s.amount;
    });

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
