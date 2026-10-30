"use server";

import { addDays, format, parseISO } from "date-fns";
import { createClient } from "@/utils/supabase/server";
import { fetchAll } from "@/lib/fetch-all";
import {
  cashBalance,
  pickBase,
  slotKey,
  type CashFlow,
  type Slot,
} from "@/lib/cash";
import type { CashEntryRow } from "@/app/visits/schema";

const nextDay = (d: string) => format(addDays(parseISO(d), 1), "yyyy-MM-dd");
const day = (s: string) => s.slice(0, 10);
const uniq = (xs: (string | undefined)[]) => [
  ...new Set(xs.filter((x): x is string => !!x)),
];

export type CashSummary = {
  configured: boolean; // sudah ada Saldo Awal pada atau sebelum awal rentang
  opening: number;
  closing: number;
  setor: number;
  keluar: number;
  keluarList: { note: string; amount: number }[];
  methods: { Cash: number; QRIS: number; Transfer: number; BPJS: number };
  bpjsDept: { Umum: number; Gigi: number };
  staff: string[];
};

export async function getCashEntries(days = 45): Promise<CashEntryRow[]> {
  const supabase = await createClient();
  const since = format(addDays(new Date(), -days), "yyyy-MM-dd");
  const { data, error } = await supabase
    .from("cash_entries")
    .select(
      "id, entry_date, entry_shift, kind, amount, note, staff_id, staff:staff!staff_id ( name )",
    )
    .gte("entry_date", since)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CashEntryRow[];
}

export async function getCashSummary(
  from: Slot,
  to: Slot,
): Promise<CashSummary> {
  const supabase = await createClient();
  const toEnd = nextDay(to.date);

  // 1. titik mulai: Saldo Awal terakhir pada atau sebelum awal rentang
  const { data: baseRows, error: baseError } = await supabase
    .from("cash_entries")
    .select("entry_date, entry_shift, amount")
    .eq("kind", "Saldo Awal")
    .lte("entry_date", from.date)
    .order("created_at", { ascending: false })
    .limit(50);
  if (baseError) throw new Error(baseError.message);
  const base = pickBase(
    (baseRows ?? []).map((r) => ({
      date: r.entry_date,
      shift: r.entry_shift,
      amount: Number(r.amount),
    })),
    from,
  );
  const start = base?.date ?? from.date;

  type Pay = {
    payment_date: string;
    payment_shift: string;
    payment_method: string;
    amount: number;
    is_settlement: boolean;
    visits: { department: string } | null;
    cashier: { name: string } | null;
  };
  type Sale = {
    sale_date: string;
    sale_shift: string;
    payment_method: string;
    amount: number;
    staff: { name: string } | null;
  };

  const [cashPay, cashOtc, entries, rangePay, rangeOtc] = await Promise.all([
    base
      ? fetchAll<Pay>((a, b) =>
          supabase
            .from("visit_payments")
            .select("payment_date, payment_shift, amount")
            .eq("payment_method", "Cash")
            .gte("payment_date", start)
            .lt("payment_date", toEnd)
            .order("id")
            .range(a, b),
        )
      : Promise.resolve([] as Pay[]),
    base
      ? fetchAll<Sale>((a, b) =>
          supabase
            .from("otc_sales")
            .select("sale_date, sale_shift, amount")
            .eq("payment_method", "Cash")
            .gte("sale_date", start)
            .lt("sale_date", toEnd)
            .order("id")
            .range(a, b),
        )
      : Promise.resolve([] as Sale[]),
    fetchAll<{
      entry_date: string;
      entry_shift: string;
      kind: string;
      amount: number;
      note: string | null;
    }>((a, b) =>
      supabase
        .from("cash_entries")
        .select("entry_date, entry_shift, kind, amount, note")
        .in("kind", ["Setor", "Keluar"])
        .gte("entry_date", start)
        .lte("entry_date", to.date)
        .order("id")
        .range(a, b),
    ),
    fetchAll<Pay>((a, b) =>
      supabase
        .from("visit_payments")
        .select(
          "payment_date, payment_shift, payment_method, amount, is_settlement, visits!visit_id ( department ), cashier:staff!cashier_staff_id ( name )",
        )
        .gte("payment_date", from.date)
        .lt("payment_date", toEnd)
        .order("id")
        .range(a, b),
    ),
    fetchAll<Sale>((a, b) =>
      supabase
        .from("otc_sales")
        .select(
          "sale_date, sale_shift, payment_method, amount, staff:staff!staff_id ( name )",
        )
        .gte("sale_date", from.date)
        .lt("sale_date", toEnd)
        .order("id")
        .range(a, b),
    ),
  ]);

  // 2. saldo berantai (hanya cash)
  const n = (x: number) => Number(x);
  const flows: CashFlow[] = [
    ...cashPay.map((p) => ({
      date: day(p.payment_date),
      shift: p.payment_shift,
      cash: n(p.amount),
      setor: 0,
      keluar: 0,
    })),
    ...cashOtc.map((s) => ({
      date: s.sale_date,
      shift: s.sale_shift,
      cash: n(s.amount),
      setor: 0,
      keluar: 0,
    })),
    ...entries.map((e) => ({
      date: e.entry_date,
      shift: e.entry_shift,
      cash: 0,
      setor: e.kind === "Setor" ? n(e.amount) : 0,
      keluar: e.kind === "Keluar" ? n(e.amount) : 0,
    })),
  ];
  const bal = cashBalance(base, flows, from, to);

  // 3. rincian rentang laporan (semua cara bayar)
  const inRange = (s: Slot) =>
    slotKey(s) >= slotKey(from) && slotKey(s) <= slotKey(to);
  const pays = rangePay.filter((p) =>
    inRange({ date: day(p.payment_date), shift: p.payment_shift }),
  );
  const sales = rangeOtc.filter((s) =>
    inRange({ date: s.sale_date, shift: s.sale_shift }),
  );
  const out = entries.filter((e) =>
    inRange({ date: e.entry_date, shift: e.entry_shift }),
  );

  const methods = { Cash: 0, QRIS: 0, Transfer: 0, BPJS: 0 };
  for (const x of [...pays, ...sales]) {
    if (x.payment_method in methods)
      methods[x.payment_method as keyof typeof methods] += n(x.amount);
  }
  const bpjs = pays.filter(
    (p) => p.payment_method === "BPJS" && !p.is_settlement,
  );

  return {
    configured: !!bal,
    opening: bal?.opening ?? 0,
    closing: bal?.closing ?? 0,
    setor: out
      .filter((e) => e.kind === "Setor")
      .reduce((s, e) => s + n(e.amount), 0),
    keluar: out
      .filter((e) => e.kind === "Keluar")
      .reduce((s, e) => s + n(e.amount), 0),
    keluarList: out
      .filter((e) => e.kind === "Keluar")
      .map((e) => ({ note: e.note ?? "-", amount: n(e.amount) })),
    methods,
    bpjsDept: {
      Umum: bpjs.filter((p) => p.visits?.department === "Umum").length,
      Gigi: bpjs.filter((p) => p.visits?.department === "Gigi").length,
    },
    staff: uniq([
      ...pays.map((p) => p.cashier?.name),
      ...sales.map((s) => s.staff?.name),
    ]),
  };
}
