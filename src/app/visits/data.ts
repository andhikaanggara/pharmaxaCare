// app/visits/data.ts

"use server";

import { PatientOption } from "./schema";
import { createClient } from "@/utils/supabase/server";
import { ROOM_CARES } from "./schema";
import { format, subDays } from "date-fns";
import { fetchAll } from "@/lib/fetch-all";

import type {
  DiagnosisOption,
  OtcSaleRow,
  StaffOption,
  TreatmentOption,
  VisitRow,
} from "./schema";

const VISIT_SELECT = `
      id,
      department, 
      guarantor, 
      care, 
      room, 
      diagnoses_id,
      doctor_staff_id, 
      nurse_staff_id,
      admission_date, 
      admission_shift, 
      discharge_date, 
      discharge_shift,
      registration_staff_id,
      patient_condition, 
      registration_staff:staff!registration_staff_id ( id, name ),
      doctor:staff!doctor_staff_id ( id, name ),
      nurse:staff!nurse_staff_id ( id, name ),
      diagnoses!diagnoses_id ( id, code, name ),

      patients ( id, name, gender, birth_date, phone, address, patient_group, is_new ),
            
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

type DateRangeYmd = { from: string; to: string };

export async function getVisitRows(range: DateRangeYmd): Promise<VisitRow[]> {
  const supabase = await createClient();
  return fetchAll<VisitRow>((a, b) =>
    supabase
      .from("visits")
      .select(VISIT_SELECT)
      .gte("admission_date", range.from)
      .lte("admission_date", range.to)
      .order("admission_date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id")
      .range(a, b),
  );
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

export async function getOtcSales(range: DateRangeYmd): Promise<OtcSaleRow[]> {
  const supabase = await createClient();
  return fetchAll<OtcSaleRow>((a, b) =>
    supabase
      .from("otc_sales")
      .select(
        "id, sale_date, sale_shift, staff_id, amount, payment_method, drug_names, staff:staff!staff_id ( name )",
      )
      .gte("sale_date", range.from)
      .lte("sale_date", range.to)
      .order("sale_date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id")
      .range(a, b),
  );
}

export async function getPatients(): Promise<PatientOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("id, name, gender, birth_date, address")
    .order("name");

  if (error) throw new Error(error.message);
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
