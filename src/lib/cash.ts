"use server";

// ============================================================
// SALDO KAS TUNAI - bagian server (baca & tulis database)
// File ini "use server", jadi semua fungsi di sini boleh dipanggil dari
// komponen client (tombol laporan, form).
// ============================================================
import { createClient } from "@/utils/supabase/server";
import {
  addDaysIso,
  calcOpeningBalance,
  cashEntrySchema,
  type CashEntryInput,
  type CashEntryRow,
  type CashFlowRow,
  type CashOpeningRow,
  type CashSummary,
} from "./cash-shared";

// Peran yang boleh dipilih sebagai petugas kas (huruf kecil)
const CASH_STAFF_ROLE = "farmasi";

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

/**
 * Data saldo kas untuk satu tanggal.
 * shift = "Pagi" | "Sore" | "Malam" | "all"
 * Saldo Awal "all" = saldo awal shift Pagi pada tanggal itu.
 */
export async function getCashSummary(
  date: string, // "yyyy-MM-dd"
  shift: string,
): Promise<CashSummary> {
  const supabase = await createClient();
  const targetShift = shift === "all" ? "Pagi" : shift;

  // 1) Titik awal saldo (tabel kecil)
  const { data: openingData, error: openingError } = await supabase
    .from("cash_opening")
    .select("opening_date, opening_shift, amount");
  if (openingError) throw new Error(openingError.message);
  const anchors = ((openingData ?? []) as CashOpeningRow[]).map((row) => ({
    ...row,
    amount: Number(row.amount),
  }));

  // 2) Ambil data mulai tanggal titik awal terakhir sampai tanggal laporan
  const anchorDates = anchors
    .map((row) => row.opening_date)
    .filter((anchorDate) => anchorDate <= date)
    .sort();
  const startDate = anchorDates[anchorDates.length - 1];
  const fromDate = startDate ?? date;
  const untilDate = addDaysIso(date, 1); // batas atas (tidak termasuk)

  // 3) Pengeluaran & setoran
  const entries = (
    await fetchAllPages<CashEntryRow>((from, to) =>
      supabase
        .from("cash_entries")
        .select(
          "id, entry_date, entry_shift, entry_type, description, amount, staff:staff!staff_id ( name )",
        )
        .gte("entry_date", fromDate)
        .lt("entry_date", untilDate)
        .order("entry_date")
        .order("created_at")
        .order("id")
        .range(from, to),
    )
  ).map((entry) => ({ ...entry, amount: Number(entry.amount) }));

  // 4) Pembayaran tunai pasien
  // CATATAN: penjualan apotek (otc_sales) belum dihitung karena belum ada cara
  // bayar. Kalau sudah ada, tambahkan yang tunai di sini DAN di renderKeuangan.
  const payments = startDate
    ? await fetchAllPages<{
        payment_date: string;
        payment_shift: string;
        amount: number;
      }>((from, to) =>
        supabase
          .from("visit_payments")
          .select("payment_date, payment_shift, amount")
          .eq("payment_method", "Cash")
          .gte("payment_date", startDate)
          .lt("payment_date", untilDate)
          .order("id")
          .range(from, to),
      )
    : [];

  const cashIn: CashFlowRow[] = payments.map((payment) => ({
    date: payment.payment_date.slice(0, 10),
    shift: payment.payment_shift,
    amount: Number(payment.amount),
  }));
  const cashOut: CashFlowRow[] = entries.map((entry) => ({
    date: entry.entry_date.slice(0, 10),
    shift: entry.entry_shift,
    amount: entry.amount,
  }));

  // 5) Rincian yang tampil di laporan = tanggal & shift yang dipilih
  const reportEntries = entries.filter(
    (entry) =>
      entry.entry_date.slice(0, 10) === date &&
      (shift === "all" || entry.entry_shift === shift),
  );

  return {
    openingBalance: calcOpeningBalance(
      anchors,
      { date, shift: targetShift },
      cashIn,
      cashOut,
    ),
    expenses: reportEntries.filter((entry) => entry.entry_type === "Keluar"),
    deposits: reportEntries.filter((entry) => entry.entry_type === "Setor"),
  };
}

/** Daftar nama petugas (peran farmasi) untuk pilihan di form. */
export async function getCashStaff(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff")
    .select("id, name, roles ( name )")
    .order("name");
  if (error) throw new Error(error.message);

  type Row = { id: string; name: string; roles: { name: string } | null };
  return ((data ?? []) as unknown as Row[])
    .filter((row) => row.roles?.name.toLowerCase() === CASH_STAFF_ROLE)
    .map(({ id, name }) => ({ id, name }));
}

/** Simpan satu pengeluaran / setoran. */
export async function addCashEntry(
  input: CashEntryInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Cek ulang di server (form di client bisa dilewati)
  const parsed = cashEntrySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cash_entries").insert(parsed.data);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
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
