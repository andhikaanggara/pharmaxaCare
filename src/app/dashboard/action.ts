"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authAction } from "@/utils/action";
import { CashPayloadSchema, type CashPayload } from "@/app/visits/schema";

const PATH = "/dashboard"; // sesuaikan dengan rute dashboard

const toRow = (v: CashPayload) => ({
  entry_date: v.date,
  entry_shift: v.shift,
  kind: v.kind,
  amount: v.amount,
  note: v.note || null,
  staff_id: v.staff_id,
});
const parse = (input: CashPayload) => {
  const p = CashPayloadSchema.safeParse(input);
  if (!p.success)
    throw new Error(p.error.issues[0]?.message ?? "Data tidak valid");
  return p.data;
};
const uuid = (id: string) => {
  if (!z.string().uuid().safeParse(id).success)
    throw new Error("ID tidak valid");
};

export async function createCashEntry(input: CashPayload) {
  return authAction(async ({ supabase, isGuest }) => {
    const { error } = await supabase
      .from("cash_entries")
      .insert({ ...toRow(parse(input)), is_demo: isGuest });
    if (error) throw new Error(error.message);
    revalidatePath(PATH);
    return { ok: true };
  });
}

export async function updateCashEntry(id: string, input: CashPayload) {
  return authAction(async ({ supabase }) => {
    uuid(id);
    const { data, error } = await supabase
      .from("cash_entries")
      .update(toRow(parse(input)))
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data)
      throw new Error(
        "Catatan tidak ditemukan atau tidak dapat diubah (cek akses/RLS)",
      );
    revalidatePath(PATH);
    return { ok: true };
  });
}

export async function deleteCashEntry(id: string) {
  return authAction(async ({ supabase }) => {
    uuid(id);
    const { data, error } = await supabase
      .from("cash_entries")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw new Error(error.message);
    if (!data?.length)
      throw new Error(
        "Catatan tidak ditemukan atau tidak dapat dihapus (cek akses/RLS)",
      );
    revalidatePath(PATH);
    return { ok: true };
  });
}
