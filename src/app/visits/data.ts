"use server";

import { PatientOption, VisitTreatmentType, VisitType } from "./schema";
import { createClient } from "@/utils/supabase/server";
import { ROOM_CARES } from "./schema";

import type {
  DiagnosisOption,
  OtcSaleRow,
  StaffOption,
  TreatmentOption,
  VisitRow,
} from "./schema";
import { format, subDays } from "date-fns";

const VISIT_SELECT = `
      id, department, guarantor, care, room, diagnoses_id,
      doctor_staff_id, nurse_staff_id,
      admission_date, admission_shift, discharge_date, registration_staff_id,
      patients ( id, name, gender, birth_date, phone, address, patient_group, is_new ),
      registration_staff:staff!registration_staff_id ( id, name ),
      doctor:staff!doctor_staff_id ( id, name ),
      nurse:staff!nurse_staff_id ( id, name ),
      diagnoses!diagnoses_id ( id, code, name ),
      visit_treatments (
        id, 
        treatment_id, 
        treatment_date, 
        treatment_shift,
        operator_staff_id, 
        assistant_staff_id,
        treatments ( name ),
        operator:staff!operator_staff_id ( name ),
        assistant:staff!assistant_staff_id ( name )
      ),
      patient_condition, discharge_shift,
      visit_prescription:visit_prescriptions (
        id,
        prescription_type,
        pharmacist_staff_id,
        prescription_date,
        prescription_shift,
        pharmacist:staff!pharmacist_staff_id ( name )
      ),
      visit_payment:visit_payments (
        id,
        billed_amount,
        amount,
        payment_method,
        payment_date,
        payment_shift,
        cashier_staff_id,
        cashier:staff!cashier_staff_id ( name ),
        is_settlement
      )
`;

export async function getVisitRows(): Promise<VisitRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("visits")
    .select(VISIT_SELECT)
    .order("admission_date", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as VisitRow[];
}

export async function getVisits(): Promise<VisitType[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("visits").select();
  return data || [];
}

export async function getVisitTreatments(): Promise<VisitTreatmentType[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("visit_treatments").select();
  return data || [];
}

export async function getPatients(): Promise<PatientOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("patients")
    .select("id, name, gender, birth_date, address")
    .order("name");
  return data ?? [];
}

export async function getStaff(): Promise<StaffOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff")
    .select("id, name")
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDiagnoses(): Promise<DiagnosisOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("diagnoses")
    .select("id, code, name")
    .order("code");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTreatments(): Promise<TreatmentOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("treatments")
    .select("id, name")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getInpatientRows(): Promise<VisitRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("visits")
    .select(VISIT_SELECT)
    .in("care", [...ROOM_CARES])
    .is("discharge_date", null)
    .order("room")
    .order("admission_date");

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as VisitRow[];
}

// ==================================
// ===== PENJUALAN BEBAS APOTEK =====
// ==================================
export async function getOtcSales(): Promise<OtcSaleRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("otc_sales")
    .select(
      "id, sale_date, sale_shift, staff_id, amount, drug_names, staff:staff!staff_id ( name ), payment_method",
    )
    .order("sale_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as OtcSaleRow[];
}

export type DutyEntry = {
  date: string;
  shift: string;
  role: string;
  name: string;
};

export async function getDutyRoster(days = 14): Promise<DutyEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendances")
    .select("date, shift, staff:staff!staff_id ( name, roles ( name ) )")
    .gte("date", format(subDays(new Date(), days), "yyyy-MM-dd"));
  if (error) throw new Error(error.message);

  type Row = {
    date: string;
    shift: string;
    staff: { name: string; roles: { name: string } | null } | null;
  };
  return ((data ?? []) as unknown as Row[]).flatMap((r) =>
    r.staff?.roles
      ? [
          {
            date: r.date,
            shift: r.shift,
            role: r.staff.roles.name.toLowerCase(),
            name: r.staff.name,
          },
        ]
      : [],
  );
}
