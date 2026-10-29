import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const pad = (n: number) => String(n).padStart(2, "0");
const parts = (day: string) =>
  day.split("-").map(Number) as [number, number, number];

// "yyyy-MM-dd" dengan limpahan bulan/hari dirapikan (bulan 13 = Januari tahun depan)
export const norm = (y: number, m: number, d: number) => {
  const t = new Date(Date.UTC(y, m - 1, d));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
};

export const todayYmd = () =>
  new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);

// timestamp UTC (admission_date) -> tanggal WIB
export const wibDay = (ts: string) => {
  const utc = new Date(
    !ts.includes("T") || /(Z|[+-]\d{2}:?\d{2})$/.test(ts) ? ts : `${ts}Z`,
  );
  return new Date(utc.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
};

// awal hari WIB, dalam format timestamp UTC tanpa zona (cocok dengan admission_date)
export const wibStart = (day: string) =>
  new Date(`${day}T00:00:00+07:00`).toISOString().slice(0, 19);

/** Bulan kalender dari hari yang dipilih */
export function monthRange(day: string) {
  const [y, m] = parts(day);
  return {
    key: `${y}-${pad(m)}`,
    start: norm(y, m, 1),
    endExclusive: norm(y, m + 1, 1),
    days: new Date(Date.UTC(y, m, 0)).getUTCDate(),
  };
}

// pembagi rata-rata: bulan berjalan = sampai hari ini, selain itu = seluruh hari
export const elapsedDays = (key: string, days: number, today: string) =>
  today.startsWith(key) ? Number(today.slice(8, 10)) : days;

/** Periode gaji (tanggal 28 s.d. 27) yang memuat hari tersebut */
export function payrollPeriod(day: string) {
  const [y, m, d] = parts(day);
  const start = d >= 28 ? norm(y, m, 28) : norm(y, m - 1, 28);
  const [sy, sm] = parts(start);
  return {
    start,
    end: norm(sy, sm + 1, 27),
    endExclusive: norm(sy, sm + 1, 28),
  };
}

const fmt = (day: string) =>
  format(parseISO(day), "d MMM yyyy", { locale: idLocale });
export const periodLabel = (p: { start: string; end: string }) =>
  `${fmt(p.start)} - ${fmt(p.end)}`;
export const monthLabel = (key: string) =>
  format(parseISO(`${key}-01`), "MMMM yyyy", { locale: idLocale });

export function periodOptions(today: string, n = 6) {
  const [y, m] = parts(payrollPeriod(today).start);
  return Array.from({ length: n }, (_, i) => {
    const p = payrollPeriod(norm(y, m - i, 28));
    return { value: p.start, label: periodLabel(p) };
  });
}
