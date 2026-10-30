// ============================================================
// SALDO KAS TUNAI - bagian yang aman dipakai di server MAUPUN client
// (skema form, tipe data, dan rumus saldo). Tidak ada akses database di sini.
// ============================================================
import { z } from "zod";

// Urutan shift dalam sehari. Urutan inilah yang dipakai untuk menghitung saldo.
export const CASH_SHIFTS = ["Pagi", "Sore", "Malam"] as const;
export const CASH_ENTRY_TYPES = ["Keluar", "Setor"] as const;

// ----- Skema form (dipakai form di client dan dicek ulang di server) -----
export const cashEntrySchema = z.object({
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  entry_shift: z.enum(CASH_SHIFTS, { error: "Pilih shift" }),
  entry_type: z.enum(CASH_ENTRY_TYPES, { error: "Pilih jenis" }),
  description: z
    .string()
    .trim()
    .min(3, "Keterangan minimal 3 huruf")
    .max(200, "Keterangan maksimal 200 huruf"),
  amount: z
    .number({ error: "Isi nominal" })
    .int("Nominal harus bilangan bulat")
    .positive("Nominal harus lebih dari 0"),
  staff_id: z.string().min(1, "Pilih nama petugas"),
});
export type CashEntryInput = z.infer<typeof cashEntrySchema>;

// ----- Tipe data -----

/** Satu baris pengeluaran / setoran (untuk daftar di laporan). */
export type CashEntryRow = {
  id: string;
  entry_date: string;
  entry_shift: string;
  entry_type: "Keluar" | "Setor";
  description: string;
  amount: number;
  staff: { name: string } | null;
};

/** Titik awal: saldo awal SEBELUM shift ini dimulai. */
export type CashOpeningRow = {
  opening_date: string;
  opening_shift: string;
  amount: number;
};

/** Satu mutasi uang tunai (masuk atau keluar) pada tanggal + shift tertentu. */
export type CashFlowRow = { date: string; shift: string; amount: number };

// ----- Rumus -----

/** Nomor urut sebuah shift: makin besar = makin baru. NaN bila tidak valid. */
export const shiftPosition = (date: string, shift: string) => {
  const shiftIndex = (CASH_SHIFTS as readonly string[]).indexOf(shift);
  const dayNumber = Date.parse(`${date.slice(0, 10)}T00:00:00Z`) / 86_400_000;
  return shiftIndex < 0 ? NaN : dayNumber * 3 + shiftIndex;
};

/** Tambah / kurangi hari pada tanggal "yyyy-MM-dd". */
export const addDaysIso = (date: string, days: number) => {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
};

/**
 * Saldo Awal sebuah shift
 *   = titik awal terakhir yang belum melewati shift itu
 *   + semua uang tunai masuk sejak titik awal sampai SEBELUM shift itu
 *   - semua uang keluar / setor pada rentang yang sama.
 * Mengembalikan null kalau belum ada titik awal.
 */
export function calcOpeningBalance(
  anchors: CashOpeningRow[],
  target: { date: string; shift: string },
  cashIn: CashFlowRow[],
  cashOut: CashFlowRow[],
): number | null {
  const targetPosition = shiftPosition(target.date, target.shift);

  const anchor = anchors
    .map((row) => ({
      ...row,
      position: shiftPosition(row.opening_date, row.opening_shift),
    }))
    .filter((row) => row.position <= targetPosition)
    .sort((a, b) => b.position - a.position)[0];
  if (!anchor) return null;

  const sumInRange = (rows: CashFlowRow[]) =>
    rows
      .filter((row) => {
        const position = shiftPosition(row.date, row.shift);
        return position >= anchor.position && position < targetPosition;
      })
      .reduce((total, row) => total + row.amount, 0);

  return anchor.amount + sumInRange(cashIn) - sumInRange(cashOut);
}
