import { z } from "zod";

export const VisitFormSchema = z
  .object({
    isNewPatient: z.boolean(),
    patientId: z.string(),
    newPatientName: z.string(),
    admission_date: z.date(),
    admission_shift: z.enum(["Pagi", "Sore", "Malam"]),
    department: z.string().min(1, "Pilih departemen").max(100),
    guarantor: z.string().min(1, "Pilih penjamin").max(100),
  })
  .superRefine((v, ctx) => {
    if (v.isNewPatient) {
      if (v.newPatientName.trim().length < 3) {
        ctx.addIssue({
          code: "custom",
          path: ["newPatientName"],
          message: "Nama pasien minimal 3 karakter",
        });
      }
    } else if (!z.string().uuid().safeParse(v.patientId).success) {
      ctx.addIssue({
        code: "custom",
        path: ["patientId"],
        message: "Pilih pasien terlebih dahulu",
      });
    }
  });
export type VisitFormType = z.infer<typeof VisitFormSchema>;

export type PatientOption = {
  id: string;
  name: string;
  gender: string | null;
  birth_date: string | null;
  address: string | null;
};

export type VisitRow = {
  id: string;
  department: string;
  guarantor: string;
  care: string | null;
  diagnoses_id: string | null;
  diagnoses: { id: string; code: string; name: string } | null;
  room: string | null;
  admission_date: string;
  admission_shift: string;
  discharge_date: string | null;
  discharge_shift: string | null;

  patient_condition: string | null;

  registration_staff_id: string | null;
  registration_staff: { id: string; name: string } | null;
  doctor_staff_id: string | null;
  doctor: { id: string; name: string } | null;
  nurse_staff_id: string | null;
  nurse: { id: string; name: string } | null;
  patients: {
    id: string;
    name: string;
    gender: string | null;
    birth_date: string | null;
    phone: string | null;
    address: string | null;
    patient_group: string | null;
    is_new: boolean;
  } | null;
  visit_treatments: VisitTreatmentRow[];
  visit_prescription: VisitPrescriptionRow[];
  visit_payment: VisitPaymentRow[];
};

export type StaffOption = { id: string; name: string };

export const PatientRegistrationSchema = z.object({
  name: z.string().min(3, "Nama pasien minimal 3 karakter"),
  gender: z.enum(["Laki-laki", "Perempuan"], { error: "Pilih jenis kelamin" }),
  birth_date: z.date({ error: "Tanggal lahir wajib diisi" }),
  phone: z.string().min(10, "Nomor HP minimal 10 digit").or(z.literal("")),
  patient_group: z.string().min(1, "Kelompok wajib diisi"),
  address: z.string().min(5, "Alamat minimal 5 karakter"),
  patient_type: z.enum(["Baru", "Lama"], { error: "Pilih jenis pasien" }),
  registration_staff_id: z.string().uuid("Pilih petugas pendaftaran"),
});
export type PatientRegistrationType = z.infer<typeof PatientRegistrationSchema>;

// Versi untuk server: tanggal lahir berupa string "yyyy-MM-dd"
export const PatientRegistrationPayloadSchema =
  PatientRegistrationSchema.extend({
    birth_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal lahir tidak valid"),
  });
export type PatientRegistrationPayload = z.infer<
  typeof PatientRegistrationPayloadSchema
>;

// ===============================

export const VisitSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  department: z.string().max(100),
  guarantor: z.string().max(100),
  diagnosis: z.string().max(255),
  admission_date: z.date(),
  admission_shift: z.enum(["Pagi", "Sore", "Malam"]),
  discharge_date: z.date().nullable(),
  discharge_shift: z.enum(["Pagi", "Sore", "Malam"]).nullable(),
  registration_staff_id: z.string().uuid(),
  room: z.string().max(100),
  is_demo: z.boolean().default(true),
});

export const VisitTreatmentSchema = z.object({
  id: z.string().uuid(),
  visitId: z.string().uuid(),
  treatment_id: z.string().uuid(),
  operator_staff_id: z.string().uuid(),
  assistant_staff_id: z.string().uuid().nullable(),
  treatment_date: z.date(),
  treatment_shift: z.enum(["Pagi", "Sore", "Malam"]),
  is_demo: z.boolean().default(true),
});

export const VisitPrescriptionSchema = z.object({
  id: z.string().uuid(),
  visitId: z.string().uuid(),
  prescription_type: z.string().max(100),
  pharmacist_staff_id: z.string().uuid(),
  dispensing_date: z.date(),
  dispensing_shift: z.enum(["Pagi", "Sore", "Malam"]),
  is_demo: z.boolean().default(true),
});

// visit_payments schema
export const VisitPaymentSchema = z.object({
  id: z.string().uuid(),
  visitId: z.string().uuid(),
  amount: z.number().positive(),
  payment_method: z.string().max(50),
  payment_date: z.date(),
  payment_shift: z.enum(["Pagi", "Sore", "Malam"]),
  cashier_staff_id: z.string().uuid().nullable(),
  is_demo: z.boolean().default(true),
});

export type VisitType = z.infer<typeof VisitSchema>;
export type VisitPaymentType = z.infer<typeof VisitPaymentSchema>;
export type VisitTreatmentType = z.infer<typeof VisitTreatmentSchema>;
export type VisitPrescriptionType = z.infer<typeof VisitPrescriptionSchema>;

// ==========
export const SHIFTS = ["Pagi", "Sore", "Malam"] as const;
export const CARE_OPTIONS = [
  "Rawat Jalan",
  "Rawat Inap",
  "Home Visit",
  "Surat Sehat",
  "Observasi",
  "Infus Vitamin",
  "Copy Resep",
  "Rujuk",
  "Lab",
] as const;
export const ROOM_CARES = ["Rawat Inap", "Home Visit"] as const;
export const ROOMS = [
  "Anggrek",
  "Bougenvile",
  "Cempaka",
  "Dahlia",
  "Edlewise",
] as const;

export const isRoomCare = (care?: string | null) =>
  !!care && (ROOM_CARES as readonly string[]).includes(care);

export type DiagnosisOption = { id: string; code: string; name: string };
export type TreatmentOption = { id: string; name: string };

type IssueCtx = {
  addIssue: (issue: {
    code: "custom";
    path: (string | number)[];
    message: string;
  }) => void;
};

function checkRoom(v: { care: string; room?: string }, ctx: IssueCtx) {
  if (isRoomCare(v.care) && !v.room) {
    ctx.addIssue({ code: "custom", path: ["room"], message: "Pilih kamar" });
  }
}

function checkGroup(
  g: { operator_staff_id: string; assistant_staff_id: string },
  ctx: IssueCtx,
) {
  if (g.assistant_staff_id && g.assistant_staff_id === g.operator_staff_id) {
    ctx.addIssue({
      code: "custom",
      path: ["assistant_staff_id"],
      message: "Asisten tidak boleh sama dengan operator",
    });
  }
}

const TreatmentGroupBase = z.object({
  operator_staff_id: z.string().min(1, "Pilih operator"),
  assistant_staff_id: z.string(), // "" = tidak ada asisten
  treatment_shift: z.enum(SHIFTS, { error: "Pilih shift" }),
  treatments: z
    .array(z.object({ treatment_id: z.string().min(1, "Pilih nama tindakan") }))
    .min(1, "Tambahkan minimal satu tindakan"),
});

const TreatmentFormBase = z.object({
  diagnoses_id: z.string().min(1, "Pilih diagnosis"),
  care: z.enum(CARE_OPTIONS, { error: "Pilih penanganan" }),
  room: z.enum(ROOMS).optional(),
  doctor_staff_id: z.string().min(1, "Pilih dokter"),
  nurse_staff_id: z.string().min(1, "Pilih perawat"),
});

export const TreatmentGroupSchema = TreatmentGroupBase.extend({
  treatment_date: z.date({ error: "Pilih tanggal tindakan" }),
}).superRefine(checkGroup);

export const TreatmentGroupPayloadSchema = TreatmentGroupBase.extend({
  treatment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tindakan tidak valid"),
}).superRefine(checkGroup);

export const TreatmentFormSchema = TreatmentFormBase.extend({
  groups: z.array(TreatmentGroupSchema),
}).superRefine(checkRoom);

export const TreatmentPayloadSchema = TreatmentFormBase.extend({
  groups: z.array(TreatmentGroupPayloadSchema),
}).superRefine(checkRoom);

export type FollowUpFormType = z.infer<typeof TreatmentGroupSchema>;
export type FollowUpPayload = z.infer<typeof TreatmentGroupPayloadSchema>;

export type TreatmentFormType = z.infer<typeof TreatmentFormSchema>;
export type TreatmentPayload = z.infer<typeof TreatmentPayloadSchema>;

// Baris tindakan hasil query
export type VisitTreatmentRow = {
  id: string;
  treatment_id: string;
  treatment_date: string;
  treatment_shift: string;
  operator_staff_id: string | null;
  assistant_staff_id: string | null;
  treatments: { name: string } | null;
  operator: { name: string } | null;
  assistant: { name: string } | null;
};

export function groupTreatments(rows: VisitTreatmentRow[]) {
  const map = new Map<
    string,
    { key: string; first: VisitTreatmentRow; items: VisitTreatmentRow[] }
  >();
  for (const r of rows) {
    const key = [
      r.operator_staff_id,
      r.assistant_staff_id,
      r.treatment_date,
      r.treatment_shift,
    ].join("|");
    const g = map.get(key);
    if (g) g.items.push(r);
    else map.set(key, { key, first: r, items: [r] });
  }
  return [...map.values()];
}

export type VisitPrescriptionRow = {
  id: string;
  prescription_type: string;
  pharmacist_staff_id: string | null;
  prescription_date: string;
  prescription_shift: string;
  pharmacist: { name: string } | null;
};

export type VisitPaymentRow = {
  id: string;
  billed_amount: number;
  amount: number; // terbayar
  payment_method: string;
  payment_date: string;
  payment_shift: string;
  cashier_staff_id: string | null;
  cashier: { name: string } | null;
};

// ===== RESEP & PEMBAYARAN =====

export const CONDITIONS = [
  "Dalam Perawatan",
  "Sembuh",
  "APS",
  "Meninggal",
] as const;
export const PAYMENT_METHODS = [
  "BPJS",
  "Cash",
  "Transfer",
  "QRIS",
  "Tidak Bayar",
] as const;
export const RX_TYPES = ["Regular", "Racikan"] as const;
export const RX_CHOICES = ["Tidak ada", ...RX_TYPES] as const;

// Pembayaran muncul bila rawat jalan, atau rawat inap yang tidak lagi dirawat
export const needsPayment = (isLongStay: boolean, condition?: string | null) =>
  !isLongStay || (!!condition && condition !== "Dalam Perawatan");

const DATE_ONLY = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid");

const PaymentBase = z.object({
  billed_amount: z
    .number({ error: "Isi nominal" })
    .min(0, "Nominal tidak boleh negatif"),
  paid_amount: z
    .number({ error: "Isi jumlah terbayar" })
    .min(0, "Jumlah tidak boleh negatif"),
  payment_method: z.enum(PAYMENT_METHODS, { error: "Pilih cara bayar" }),
});

function checkPayment(
  p: { billed_amount: number; paid_amount: number; payment_method: string },
  ctx: IssueCtx,
) {
  if (p.paid_amount > p.billed_amount) {
    ctx.addIssue({
      code: "custom",
      path: ["paid_amount"],
      message: "Terbayar melebihi nominal",
    });
  }
  if (p.payment_method === "Tidak Bayar" && p.paid_amount !== 0) {
    ctx.addIssue({
      code: "custom",
      path: ["paid_amount"],
      message: "Cara bayar Tidak Bayar harus bernilai 0",
    });
  }
}

function checkFlow(
  v: {
    care?: string;
    room?: string;
    patient_condition?: string;
    prescription_type: string;
    date?: unknown;
    shift?: string;
    staff_id?: string;
    payment?: unknown;
    payment_only?: boolean;
  },
  ctx: IssueCtx,
) {
  const longStay = isRoomCare(v.care);
  const hasRx = !v.payment_only && v.prescription_type !== "Tidak ada";
  const pay = !!v.care && needsPayment(longStay, v.patient_condition);

  if (longStay && !v.room) {
    ctx.addIssue({ code: "custom", path: ["room"], message: "Pilih kamar" });
  }
  if (longStay && !v.patient_condition) {
    ctx.addIssue({
      code: "custom",
      path: ["patient_condition"],
      message: "Pilih kondisi pasien",
    });
  }
  // dirawat tanpa resep = tidak ada yang disimpan
  if (longStay && v.patient_condition && !hasRx && !pay && !v.payment_only) {
    ctx.addIssue({
      code: "custom",
      path: ["prescription_type"],
      message: "Pilih jenis resep atau ubah kondisi pasien",
    });
  }
  // tanggal, shift, petugas dipakai bersama oleh resep dan pembayaran
  if (hasRx || pay) {
    if (!v.date)
      ctx.addIssue({
        code: "custom",
        path: ["date"],
        message: "Pilih tanggal",
      });
    if (!v.shift)
      ctx.addIssue({ code: "custom", path: ["shift"], message: "Pilih shift" });
    if (!v.staff_id)
      ctx.addIssue({
        code: "custom",
        path: ["staff_id"],
        message: "Pilih petugas",
      });
  }
  if (pay && !v.payment) {
    ctx.addIssue({
      code: "custom",
      path: ["payment"],
      message: "Lengkapi data pembayaran",
    });
  }
}

const RxFlowBase = z.object({
  shift: z.enum(SHIFTS).optional(),
  staff_id: z.string().optional(),
  prescription_type: z.enum(RX_CHOICES, { error: "Pilih jenis resep" }),
  care: z.enum(CARE_OPTIONS, { error: "Pilih penanganan" }),
  room: z.enum(ROOMS).optional(),
  patient_condition: z.enum(CONDITIONS).optional(),
  payment: PaymentBase.superRefine(checkPayment).optional(),
  payment_only: z.boolean().optional(),
});

// Versi form: tanggal berupa Date
export const RxPaymentFormSchema = RxFlowBase.extend({
  date: z.date().optional(),
}).superRefine(checkFlow);

// Versi server: tanggal berupa string "yyyy-MM-dd"
export const RxPaymentPayloadSchema = RxFlowBase.extend({
  date: DATE_ONLY.optional(),
}).superRefine(checkFlow);

export type RxPaymentFormType = z.infer<typeof RxPaymentFormSchema>;
export type RxPaymentPayload = z.infer<typeof RxPaymentPayloadSchema>;

export const RxItemPayloadSchema = z.object({
  prescription_type: z.enum(RX_TYPES, { error: "Pilih jenis resep" }),
  date: DATE_ONLY,
  shift: z.enum(SHIFTS, { error: "Pilih shift" }),
  staff_id: z.string().min(1, "Pilih petugas"),
});
export const RxItemFormSchema = RxItemPayloadSchema.extend({
  date: z.date({ error: "Pilih tanggal" }),
});
export type RxItemPayload = z.infer<typeof RxItemPayloadSchema>;
export type RxItemFormType = z.infer<typeof RxItemFormSchema>;

// ==================================
// ===== PENJUALAN BEBAS APOTEK =====
// ==================================

export type OtcSaleRow = {
  id: string;
  sale_date: string;
  sale_shift: string;
  staff_id: string | null;
  amount: number;
  drug_names: string[];
  staff: { name: string } | null;
};

const OtcBase = z.object({
  shift: z.enum(SHIFTS, { error: "Pilih shift" }),
  staff_id: z.string().min(1, "Pilih petugas"),
  amount: z
    .number({ error: "Isi nominal" })
    .positive("Nominal harus lebih dari 0"),
  drugs: z
    .array(
      z.object({
        name: z
          .string()
          .trim()
          .min(1, "Isi nama obat")
          .max(100, "Maksimal 100 karakter"),
      }),
    )
    .min(1, "Tambahkan minimal satu obat"),
});

// Versi form: tanggal berupa Date
export const OtcSaleFormSchema = OtcBase.extend({
  date: z.date({ error: "Pilih tanggal" }),
});

// Versi server: tanggal berupa string "yyyy-MM-dd"
export const OtcSalePayloadSchema = OtcBase.extend({ date: DATE_ONLY });

export type OtcSaleFormType = z.infer<typeof OtcSaleFormSchema>;
export type OtcSalePayload = z.infer<typeof OtcSalePayloadSchema>;
