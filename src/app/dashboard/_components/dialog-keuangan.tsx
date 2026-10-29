"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cashEntrySchema, type CashEntryInput } from "@/lib/cash-shared";
import { addCashEntry, getCashStaff } from "@/lib/cash";
import { useEffect, useState } from "react";
import { format } from "date-fns";

// State: dialog terbuka atau tidak, dan daftar petugas
const [open, setOpen] = useState(false);
const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);
useEffect(() => {
  getCashStaff().then(setStaffList);
}, []);

const form = useForm<CashEntryInput>({
  resolver: zodResolver(cashEntrySchema),
  defaultValues: {
    entry_date: format(new Date(), "yyyy-MM-dd"),
    entry_shift: undefined, // dipilih manual
    entry_type: "Keluar",
    description: "",
    amount: undefined,
    staff_id: "",
  },
});

// Dua tombol di dashboard memanggil ini: "Pengeluaran" -> "Keluar", "Setor" -> "Setor"
const openFor = (type: "Keluar" | "Setor") => {
  form.setValue("entry_type", type);
  setOpen(true);
};

async function onSubmit(values: CashEntryInput) {
  const result = await addCashEntry(values);
  if (!result.ok) {
    form.setError("root", { message: result.error }); // tampilkan di atas tombol Simpan
    return;
  }
  // tanggal, shift, dan petugas dipertahankan untuk input berikutnya
  form.reset({ ...form.getValues(), description: "", amount: undefined });
  setOpen(false);
}
