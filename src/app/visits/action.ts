"use server";

import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { authAction } from "@/utils/action";
import {
  FollowUpPayload,
  isRoomCare,
  PatientRegistrationPayload,
  PatientRegistrationPayloadSchema,
  TreatmentGroupPayloadSchema,
  TreatmentPayload,
  TreatmentPayloadSchema,
  VisitFormSchema,
  VisitFormType,
  RxPaymentPayloadSchema,
  needsPayment,
  type RxPaymentPayload,
  RxItemPayload,
  RxItemPayloadSchema,
  OtcSalePayload,
  OtcSalePayloadSchema,
  SettlementPayload,
  SettlementPayloadSchema,
} from "./schema";

const PATH = "/dashboard/visits";
const IdListSchema = z.array(z.string().uuid()).min(1);

export async function createVisit(input: VisitFormType) {
  return authAction(async ({ supabase, isGuest }) => {
    const parsed = VisitFormSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid");
    }
    const values = parsed.data;

    let patientId = values.patientId;
    let createdPatientId: string | null = null;

    if (values.isNewPatient) {
      const { data: newPatient, error: patientError } = await supabase
        .from("patients")
        .insert({
          name: values.newPatientName.trim(),
          is_new: true,
          is_demo: isGuest,
        })
        .select("id")
        .single();

      if (patientError) {
        throw new Error(`Gagal menambah pasien: ${patientError.message}`);
      }
      patientId = newPatient.id;
      createdPatientId = newPatient.id;
    }

    const { data, error } = await supabase
      .from("visits")
      .insert({
        patient_id: patientId,
        department: values.department,
        guarantor: values.guarantor,
        admission_date: values.admission_date.toISOString(),
        admission_shift: values.admission_shift,
        is_demo: isGuest,
      })
      .select("id")
      .single();

    if (error) {
      // Hapus pasien yang baru dibuat supaya tidak jadi data yatim
      if (createdPatientId) {
        await supabase.from("patients").delete().eq("id", createdPatientId);
      }
      throw new Error(error.message);
    }

    revalidatePath(PATH);
    return data;
  });
}

export async function updateVisit(id: string, input: VisitFormType) {
  return authAction(async ({ supabase }) => {
    const parsed = VisitFormSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid");
    }
    const values = parsed.data;
    if (values.isNewPatient) {
      throw new Error(
        "Pasien baru hanya bisa ditambahkan saat membuat kunjungan",
      );
    }

    const { data, error } = await supabase
      .from("visits")
      .update({
        patient_id: values.patientId,
        department: values.department,
        guarantor: values.guarantor,
        admission_date: values.admission_date.toISOString(),
        admission_shift: values.admission_shift,
        // registration_staff_id dan is_demo sengaja tidak diubah
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      throw new Error(
        "Kunjungan tidak ditemukan atau Anda tidak punya akses untuk mengubahnya",
      );
    }

    revalidatePath(PATH);
    return data;
  });
}

export async function deleteVisit(visitId: string) {
  return authAction(async ({ supabase }) => {
    if (!z.string().uuid().safeParse(visitId).success) {
      throw new Error("ID kunjungan tidak valid");
    }

    const { data, error } = await supabase
      .from("visits")
      .delete()
      .eq("id", visitId)
      .select("id");

    if (error) {
      // 23503 = masih ada data lain yang merujuk kunjungan ini
      if (error.code === "23503") {
        throw new Error(
          "Kunjungan masih terhubung dengan data lain. Periksa foreign key (on delete cascade).",
        );
      }
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error(
        "Kunjungan tidak ditemukan atau Anda tidak punya akses untuk menghapusnya",
      );
    }

    revalidatePath(PATH);
    return { deleted: data.length };
  });
}

export async function savePatientRegistration(
  visitId: string,
  input: PatientRegistrationPayload,
) {
  return authAction(async ({ supabase }) => {
    const parsed = PatientRegistrationPayloadSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid");
    }
    const v = parsed.data;

    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .select("id, patient_id")
      .eq("id", visitId)
      .maybeSingle();
    if (visitError) throw new Error(visitError.message);
    if (!visit)
      throw new Error("Kunjungan tidak ditemukan atau tidak dapat diakses");

    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .update({
        name: v.name,
        gender: v.gender,
        birth_date: v.birth_date,
        phone: v.phone,
        address: v.address,
        patient_group: v.patient_group,
        is_new: v.patient_type === "Baru",
      })
      .eq("id", visit.patient_id)
      .select("id")
      .maybeSingle();
    if (patientError) throw new Error(patientError.message);
    if (!patient)
      throw new Error("Data pasien tidak dapat diubah (cek akses/RLS)");

    const { data: updated, error: regError } = await supabase
      .from("visits")
      .update({ registration_staff_id: v.registration_staff_id })
      .eq("id", visitId)
      .select("id")
      .maybeSingle();
    if (regError) throw new Error(regError.message);
    if (!updated)
      throw new Error("Kunjungan tidak dapat diubah (cek akses/RLS)");

    revalidatePath(PATH);
    return updated;
  });
}

export async function saveVisitTreatments(
  visitId: string,
  input: TreatmentPayload,
) {
  return authAction(async ({ supabase, isGuest }) => {
    const parsed = TreatmentPayloadSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid");
    }
    const v = parsed.data;

    // 1. Data tingkat kunjungan (sekaligus memastikan kunjungan bisa diakses)
    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .update({
        diagnoses_id: v.diagnoses_id,
        care: v.care,
        room: isRoomCare(v.care) ? (v.room ?? null) : null,
        doctor_staff_id: v.doctor_staff_id,
        nurse_staff_id: v.nurse_staff_id,
      })
      .eq("id", visitId)
      .select("id")
      .maybeSingle();
    if (visitError) throw new Error(visitError.message);
    if (!visit)
      throw new Error("Kunjungan tidak ditemukan atau tidak dapat diubah");

    // 2. Ratakan blok menjadi baris visit_treatments
    const rows = v.groups.flatMap((g) =>
      g.treatments.map((t) => ({
        visit_id: visitId,
        treatment_id: t.treatment_id,
        operator_staff_id: g.operator_staff_id,
        assistant_staff_id: g.assistant_staff_id || null,
        treatment_date: g.treatment_date,
        treatment_shift: g.treatment_shift,
        is_demo: isGuest,
      })),
    );

    // 3. Ganti isi lama: sisipkan yang baru dulu, baru hapus yang lama,
    //    supaya data lama tidak hilang kalau insert gagal.
    const { data: oldRows, error: oldError } = await supabase
      .from("visit_treatments")
      .select("id")
      .eq("visit_id", visitId);
    if (oldError) throw new Error(oldError.message);
    const oldIds = (oldRows ?? []).map((r) => r.id);

    let newIds: string[] = [];
    if (rows.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from("visit_treatments")
        .insert(rows)
        .select("id");
      if (insertError) throw new Error(insertError.message);
      newIds = (inserted ?? []).map((r) => r.id);
    }

    if (oldIds.length > 0) {
      const { data: deleted, error: deleteError } = await supabase
        .from("visit_treatments")
        .delete()
        .in("id", oldIds)
        .select("id");

      if (deleteError || (deleted ?? []).length !== oldIds.length) {
        // batalkan baris baru agar tidak terjadi data ganda
        if (newIds.length > 0) {
          await supabase.from("visit_treatments").delete().in("id", newIds);
        }
        throw new Error(
          deleteError?.message ??
            "Tindakan lama tidak dapat diganti (cek akses/RLS)",
        );
      }
    }

    revalidatePath(PATH);
    return visit;
  });
}

export async function addVisitTreatments(
  visitId: string,
  input: FollowUpPayload,
) {
  return authAction(async ({ supabase, isGuest }) => {
    const parsed = TreatmentGroupPayloadSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid");
    }
    const v = parsed.data;

    // Pastikan kunjungan ada, bisa diakses, dan data tindakan awalnya sudah diisi
    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .select("id, care")
      .eq("id", visitId)
      .maybeSingle();
    if (visitError) throw new Error(visitError.message);
    if (!visit) {
      throw new Error("Kunjungan tidak ditemukan atau tidak dapat diakses");
    }
    if (!visit.care) {
      throw new Error("Isi data tindakan awal terlebih dahulu");
    }

    const rows = v.treatments.map((t) => ({
      visit_id: visitId,
      treatment_id: t.treatment_id,
      operator_staff_id: v.operator_staff_id,
      assistant_staff_id: v.assistant_staff_id || null,
      treatment_date: v.treatment_date,
      treatment_shift: v.treatment_shift,
      is_demo: isGuest,
    }));

    const { data, error } = await supabase
      .from("visit_treatments")
      .insert(rows)
      .select("id");
    if (error) throw new Error(error.message);

    revalidatePath(PATH);
    return data;
  });
}

export async function updateTreatmentGroup(
  visitId: string,
  ids: string[],
  input: FollowUpPayload,
) {
  return authAction(async ({ supabase, isGuest }) => {
    const parsedIds = IdListSchema.safeParse(ids);
    if (!parsedIds.success) throw new Error("Data tindakan tidak valid");
    const parsed = TreatmentGroupPayloadSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid");
    }
    const v = parsed.data;
    const oldIds = parsedIds.data;

    // 1. Pastikan baris lama masih ada (belum diubah orang lain)
    const { data: existing, error: existingError } = await supabase
      .from("visit_treatments")
      .select("id")
      .eq("visit_id", visitId)
      .in("id", oldIds);
    if (existingError) throw new Error(existingError.message);
    if ((existing ?? []).length !== oldIds.length) {
      throw new Error("Data sudah berubah. Muat ulang halaman lalu coba lagi.");
    }

    // 2. Sisipkan baris baru dulu, supaya data lama aman kalau gagal
    const rows = v.treatments.map((t) => ({
      visit_id: visitId,
      treatment_id: t.treatment_id,
      operator_staff_id: v.operator_staff_id,
      assistant_staff_id: v.assistant_staff_id || null,
      treatment_date: v.treatment_date,
      treatment_shift: v.treatment_shift,
      is_demo: isGuest,
    }));
    const { data: inserted, error: insertError } = await supabase
      .from("visit_treatments")
      .insert(rows)
      .select("id");
    if (insertError) throw new Error(insertError.message);
    const newIds = (inserted ?? []).map((r) => r.id);

    // 3. Hapus baris lama; batalkan baris baru bila gagal
    const { data: deleted, error: deleteError } = await supabase
      .from("visit_treatments")
      .delete()
      .in("id", oldIds)
      .select("id");

    if (deleteError || (deleted ?? []).length !== oldIds.length) {
      await supabase.from("visit_treatments").delete().in("id", newIds);
      throw new Error(
        deleteError?.message ??
          "Tindakan lama tidak dapat diganti (cek akses/RLS)",
      );
    }

    revalidatePath(PATH);
    return { updated: newIds.length };
  });
}

export async function deleteTreatmentGroup(visitId: string, ids: string[]) {
  return authAction(async ({ supabase }) => {
    const parsedIds = IdListSchema.safeParse(ids);
    if (!parsedIds.success) throw new Error("Data tindakan tidak valid");

    const { data, error } = await supabase
      .from("visit_treatments")
      .delete()
      .eq("visit_id", visitId)
      .in("id", parsedIds.data)
      .select("id");
    if (error) throw new Error(error.message);

    if ((data ?? []).length !== parsedIds.data.length) {
      throw new Error(
        "Tindakan tidak terhapus. Data mungkin sudah berubah atau akses ditolak, muat ulang halaman.",
      );
    }

    revalidatePath(PATH);
    return { deleted: parsedIds.data.length };
  });
}

// Hapus baris berdasarkan id, lalu kembalikan jumlah baris yang benar-benar terhapus.
// Kalau RLS memblokir, Supabase tidak error: jumlahnya saja yang 0.
async function deleteByIds(
  supabase: SupabaseClient,
  table: string,
  ids: string[],
) {
  if (ids.length === 0) return 0;
  const { data, error } = await supabase
    .from(table)
    .delete()
    .in("id", ids)
    .select("id");
  if (error) throw new Error(error.message);
  return (data ?? []).length;
}

export async function saveRxPayment(visitId: string, input: RxPaymentPayload) {
  return authAction(async ({ supabase, isGuest }) => {
    // 1. Validasi input
    const parsed = RxPaymentPayloadSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid");
    }
    const v = parsed.data;

    // 2. Ambil kunjungan. Nilai lamanya disimpan untuk berjaga-jaga bila harus dikembalikan.
    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .select(
        "id, care, room, patient_condition, discharge_date, discharge_shift",
      )
      .eq("id", visitId)
      .maybeSingle();
    if (visitError) throw new Error(visitError.message);
    if (!visit) {
      throw new Error("Kunjungan tidak ditemukan atau tidak dapat diakses");
    }
    if (visit.care && visit.care !== v.care) {
      throw new Error(
        "Penanganan sudah berubah. Muat ulang halaman lalu coba lagi.",
      );
    }

    // 3. Aturan turunan dari penanganan
    const isLongStay = isRoomCare(v.care);
    const touchRx = !v.payment_only;
    const hasRx = touchRx && v.prescription_type !== "Tidak ada";
    const closing = needsPayment(isLongStay, v.patient_condition);

    // 4. Id data lama yang akan diganti.
    //    Resep: rawat jalan diganti, rawat inap hanya ditambah. Pembayaran selalu diganti.
    let oldRxIds: string[] = [];
    if (!isLongStay && touchRx) {
      const { data, error } = await supabase
        .from("visit_prescriptions")
        .select("id")
        .eq("visit_id", visitId);
      if (error) throw new Error(error.message);
      oldRxIds = (data ?? []).map((r) => r.id);
    }

    const { data: oldPay, error: oldPayError } = await supabase
      .from("visit_payments")
      .select("id, is_settlement")
      .eq("visit_id", visitId);
    if (oldPayError) throw new Error(oldPayError.message);
    if (!closing && (oldPay ?? []).some((p) => p.is_settlement)) {
      throw new Error(
        "Tidak bisa dikembalikan ke dalam perawatan karena sudah ada pelunasan",
      );
    }
    const oldPayIds = (oldPay ?? [])
      .filter((p) => !p.is_settlement)
      .map((r) => r.id);

    const newRxIds: string[] = [];
    const newPayIds: string[] = [];
    let visitUpdated = false;

    try {
      // 5. Sisipkan data baru dulu, supaya data lama aman kalau ada yang gagal.
      //    Resep "Tidak ada" tidak dikirim sama sekali ke tabel resep.
      if (hasRx) {
        const { data, error } = await supabase
          .from("visit_prescriptions")
          .insert({
            visit_id: visitId,
            prescription_type: v.prescription_type,
            pharmacist_staff_id: v.staff_id,
            prescription_date: v.date,
            prescription_shift: v.shift,
            is_demo: isGuest,
          })
          .select("id")
          .single();
        if (error) throw new Error(`Gagal menyimpan resep: ${error.message}`);
        newRxIds.push(data.id);
      }

      if (closing && v.payment) {
        // Satu petugas dicatat sebagai kasir; tanggal dan shift sama dengan resep
        const { data, error } = await supabase
          .from("visit_payments")
          .insert({
            visit_id: visitId,
            billed_amount: v.payment.billed_amount,
            amount: v.payment.paid_amount,
            payment_method: v.payment.payment_method,
            payment_date: v.date,
            payment_shift: v.shift,
            cashier_staff_id: v.staff_id,
            is_demo: isGuest,
          })
          .select("id")
          .single();
        if (error) {
          throw new Error(`Gagal menyimpan pembayaran: ${error.message}`);
        }
        newPayIds.push(data.id);
      }

      // 6. Update kunjungan: penanganan, kamar, kondisi, dan status pulang.
      //    Pulang mengikuti tanggal dan shift pembayaran; kosong bila pasien masih dirawat.
      const { data: updated, error: updateError } = await supabase
        .from("visits")
        .update({
          care: v.care,
          room: isLongStay ? (visit.room ?? v.room ?? null) : null,
          patient_condition: isLongStay ? (v.patient_condition ?? null) : null,
          discharge_date: closing ? v.date : null,
          discharge_shift: closing ? v.shift : null,
        })
        .eq("id", visitId)
        .select("id")
        .maybeSingle();
      if (updateError) throw new Error(updateError.message);
      if (!updated) {
        throw new Error("Kunjungan tidak dapat diubah (cek akses/RLS)");
      }
      visitUpdated = true;

      // 7. Hapus data lama, lalu pastikan jumlah yang terhapus sesuai
      const deletedRx = await deleteByIds(
        supabase,
        "visit_prescriptions",
        oldRxIds,
      );
      const deletedPay = await deleteByIds(
        supabase,
        "visit_payments",
        oldPayIds,
      );
      if (deletedRx !== oldRxIds.length || deletedPay !== oldPayIds.length) {
        throw new Error("Data lama tidak dapat diganti (cek akses/RLS)");
      }
    } catch (err) {
      // Ada langkah yang gagal: batalkan apa yang sudah ditulis di langkah 5 dan 6
      await deleteByIds(supabase, "visit_payments", newPayIds).catch(() => 0);
      await deleteByIds(supabase, "visit_prescriptions", newRxIds).catch(
        () => 0,
      );
      if (visitUpdated) {
        await supabase
          .from("visits")
          .update({
            care: visit.care,
            room: visit.room,
            patient_condition: visit.patient_condition,
            discharge_date: visit.discharge_date,
            discharge_shift: visit.discharge_shift,
          })
          .eq("id", visitId);
      }
      throw err;
    }

    revalidatePath(PATH);
    return { closed: closing, rxSaved: hasRx };
  });
}

// app/visits/action.ts
export async function deleteRxItem(rxId: string) {
  return authAction(async ({ supabase }) => {
    const { error } = await supabase
      .from("visit_prescriptions")
      .delete()
      .eq("id", rxId);
    if (error) throw new Error(error.message);
    revalidatePath(PATH);
    return { deleted: true };
  });
}

export async function updateRxItem(rxId: string, input: RxItemPayload) {
  return authAction(async ({ supabase }) => {
    const parsed = RxItemPayloadSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid");
    }
    const v = parsed.data;
    const { error } = await supabase
      .from("visit_prescriptions")
      .update({
        prescription_type: v.prescription_type,
        prescription_date: v.date,
        prescription_shift: v.shift,
        pharmacist_staff_id: v.staff_id,
      })
      .eq("id", rxId);
    if (error) throw new Error(error.message);
    revalidatePath(PATH);
    return { updated: true };
  });
}

// ==================================
// ===== PENJUALAN BEBAS APOTEK =====
// ==================================
const toOtcRow = (v: OtcSalePayload) => ({
  sale_date: v.date,
  sale_shift: v.shift,
  staff_id: v.staff_id,
  amount: v.amount,
  drug_names: v.drugs.map((d) => d.name),
  payment_method: v.payment_method,
});

export async function createOtcSale(input: OtcSalePayload) {
  return authAction(async ({ supabase, isGuest }) => {
    const parsed = OtcSalePayloadSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid");
    }

    const { data, error } = await supabase
      .from("otc_sales")
      .insert({ ...toOtcRow(parsed.data), is_demo: isGuest })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    revalidatePath(PATH);
    return data;
  });
}

export async function updateOtcSale(id: string, input: OtcSalePayload) {
  return authAction(async ({ supabase }) => {
    if (!z.string().uuid().safeParse(id).success) {
      throw new Error("ID penjualan tidak valid");
    }
    const parsed = OtcSalePayloadSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid");
    }

    const { data, error } = await supabase
      .from("otc_sales")
      .update(toOtcRow(parsed.data))
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      throw new Error(
        "Penjualan tidak ditemukan atau tidak dapat diubah (cek akses/RLS)",
      );
    }

    revalidatePath(PATH);
    return data;
  });
}

export async function deleteOtcSale(id: string) {
  return authAction(async ({ supabase }) => {
    if (!z.string().uuid().safeParse(id).success) {
      throw new Error("ID penjualan tidak valid");
    }

    const { data, error } = await supabase
      .from("otc_sales")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      throw new Error(
        "Penjualan tidak ditemukan atau tidak dapat dihapus (cek akses/RLS)",
      );
    }

    revalidatePath(PATH);
    return { deleted: data.length };
  });
}

export async function settleReceivable(
  visitId: string,
  input: SettlementPayload,
) {
  return authAction(async ({ supabase, isGuest }) => {
    const parsed = SettlementPayloadSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid");
    }
    const v = parsed.data;

    const { data: pays, error: payError } = await supabase
      .from("visit_payments")
      .select("billed_amount, amount, is_settlement")
      .eq("visit_id", visitId);
    if (payError) throw new Error(payError.message);

    const initial = (pays ?? []).find((p) => !p.is_settlement);
    if (!initial) throw new Error("Pembayaran awal belum ada");
    const remaining =
      initial.billed_amount - (pays ?? []).reduce((s, p) => s + p.amount, 0);
    if (remaining <= 0) throw new Error("Tagihan sudah lunas");
    if (v.amount > remaining) {
      throw new Error(
        `Melebihi sisa tagihan (Rp${remaining.toLocaleString("id-ID")})`,
      );
    }

    const { error } = await supabase.from("visit_payments").insert({
      visit_id: visitId,
      billed_amount: 0, // nominal tagihan hanya ada di pembayaran awal
      amount: v.amount,
      payment_method: v.payment_method,
      payment_date: v.date,
      payment_shift: v.shift,
      cashier_staff_id: v.staff_id,
      is_demo: isGuest,
      is_settlement: true,
    });
    if (error) throw new Error(error.message);

    revalidatePath(PATH);
    return { remaining: remaining - v.amount };
  });
}
