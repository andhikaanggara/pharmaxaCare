import { createClient } from "@/utils/supabase/server";
import { format } from "date-fns";

// Supabase membatasi 1000 baris per permintaan, jadi ambil per halaman sampai habis.
const PAGE_SIZE = 1000;
async function fetchAllPages<T>(
  runQuery: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: unknown[] | null;
    error: { message: string } | null;
  }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await runQuery(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

/** Hapus satu pengeluaran / setoran (salah input: hapus lalu input ulang). */
export async function deleteCashEntry(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("cash_entries").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export const SHIFT_ORDER = ["Pagi", "Sore", "Malam"] as const;
export type Slot = { date: string; shift: string };
export type Base = Slot & { amount: number };
export type CashFlow = Slot & { cash: number; setor: number; keluar: number };

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

// urutan waktu: tanggal, lalu Pagi < Sore < Malam
export const slotKey = (s: Slot) =>
  `${s.date}#${SHIFT_ORDER.indexOf(s.shift as never)}`;

// Saldo Awal terakhir pada atau sebelum slot (input diurutkan terbaru dulu)
export const pickBase = (bases: Base[], at: Slot) =>
  bases
    .filter((b) => slotKey(b) <= slotKey(at))
    .sort((a, b) => slotKey(b).localeCompare(slotKey(a)))[0] ?? null;

/** Saldo awal = saldo awal manual + semua arus kas sampai sebelum `from`; sisa = awal + cash - setor - keluar */
export function cashBalance(
  base: Base | null,
  flows: CashFlow[],
  from: Slot,
  to: Slot,
) {
  if (!base) return null;
  const net = (f: CashFlow) => f.cash - f.setor - f.keluar;
  const [bk, fk, tk] = [slotKey(base), slotKey(from), slotKey(to)];
  const opening =
    base.amount +
    sum(flows.filter((f) => slotKey(f) >= bk && slotKey(f) < fk).map(net));
  const inRange = flows.filter((f) => slotKey(f) >= fk && slotKey(f) <= tk);
  const cash = sum(inRange.map((f) => f.cash));
  const setor = sum(inRange.map((f) => f.setor));
  const keluar = sum(inRange.map((f) => f.keluar));
  return {
    opening,
    cash,
    setor,
    keluar,
    closing: opening + cash - setor - keluar,
  };
}

// rentang laporan dari filter dashboard: "Semua shift" = Pagi sampai Malam
export function reportSlots(f: {
  range?: { from?: Date; to?: Date };
  shift: string;
}) {
  const first = f.range?.from ?? new Date();
  const last = f.range?.to ?? first;
  const ymd = (d: Date) => format(d, "yyyy-MM-dd");
  return {
    from: { date: ymd(first), shift: f.shift === "all" ? "Pagi" : f.shift },
    to: { date: ymd(last), shift: f.shift === "all" ? "Malam" : f.shift },
  };
}
