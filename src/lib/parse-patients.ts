import * as XLSX from "xlsx";
import { z } from "zod";

const RowSchema = z.object({
  name: z
    .string()
    .min(3, "Nama minimal 3 karakter")
    .max(150, "Nama terlalu panjang"),
  gender: z.enum(["Laki-laki", "Perempuan"], {
    error: "Jenis kelamin harus L/P",
  }),
  birth_date: z.string({ error: "Tanggal lahir tidak valid" }),
  phone: z
    .string()
    .regex(/^0\d{9,14}$/, "No. HP tidak valid")
    .or(z.literal("")),
  address: z.string().min(5, "Alamat minimal 5 karakter"),
  patient_group: z.string().max(100).nullable(),
  is_new: z.boolean(),
});
export type ParsedPatient = z.infer<typeof RowSchema>;
export type RowError = { row: number; message: string };

const FIELDS = [
  "name",
  "gender",
  "birth_date",
  "phone",
  "address",
  "patient_group",
  "patient_type",
] as const;
type Field = (typeof FIELDS)[number];

// nama kolom yang diterima (huruf kecil, tanpa spasi/simbol)
const ALIASES: Record<Field, string[]> = {
  name: ["nama", "namapasien", "name"],
  gender: ["jeniskelamin", "kelamin", "jk", "gender"],
  birth_date: ["tanggallahir", "tgllahir", "birthdate", "dob"],
  phone: ["nohp", "nomorhp", "hp", "telepon", "notelp", "phone"],
  address: ["alamat", "address"],
  patient_group: ["kelompok", "kelompokpasien", "patientgroup"],
  patient_type: ["jenispasien", "statuspasien", "patienttype"],
};
const REQUIRED: Partial<Record<Field, string>> = {
  name: "Nama",
  gender: "Jenis Kelamin",
  birth_date: "Tanggal Lahir",
  address: "Alamat",
};

const GENDER: Record<string, "Laki-laki" | "Perempuan"> = {
  l: "Laki-laki",
  lakilaki: "Laki-laki",
  laki: "Laki-laki",
  pria: "Laki-laki",
  male: "Laki-laki",
  m: "Laki-laki",
  p: "Perempuan",
  perempuan: "Perempuan",
  wanita: "Perempuan",
  female: "Perempuan",
  f: "Perempuan",
};

const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const text = (v: unknown) =>
  String(v ?? "")
    .replace(/\s+/g, " ")
    .trim();
const pad = (n: number) => String(n).padStart(2, "0");

// Excel membuang angka 0 di depan nomor HP, jadi dipulihkan di sini
function normPhone(v: unknown) {
  let d = String(v ?? "").replace(/\D/g, "");
  if (d.startsWith("62")) d = `0${d.slice(2)}`;
  else if (d.startsWith("8")) d = `0${d}`;
  return d;
}

function ymd(y: number, m: number, d: number) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  const real =
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d;
  return real && y >= 1900 && dt.getTime() <= Date.now()
    ? `${y}-${pad(m)}-${pad(d)}`
    : undefined;
}

// Terima: sel tanggal Excel (angka serial), "yyyy-mm-dd", atau "dd/mm/yyyy"
function parseDate(v: unknown) {
  if (typeof v === "number") {
    const c = XLSX.SSF.parse_date_code(v);
    return c ? ymd(c.y, c.m, c.d) : undefined;
  }
  const s = text(v);
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return ymd(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  return m ? ymd(+m[3], +m[2], +m[1]) : undefined;
}

export function parsePatientsFile(buf: ArrayBuffer) {
  const wb = XLSX.read(buf, { type: "array" }); // tanggal tetap angka serial: aman dari zona waktu
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    wb.Sheets[wb.SheetNames[0]],
    {
      defval: "",
      raw: true,
    },
  );
  const rows: { row: number; data: ParsedPatient }[] = [];
  const errors: RowError[] = [];
  if (raw.length === 0) return { rows, errors, total: 0 };

  // header -> field
  const map = new Map<string, Field>();
  for (const h of Object.keys(raw[0])) {
    const f = FIELDS.find((x) => ALIASES[x].includes(norm(h)));
    if (f && ![...map.values()].includes(f)) map.set(h, f);
  }
  const missing = (Object.keys(REQUIRED) as Field[]).filter(
    (f) => ![...map.values()].includes(f),
  );
  if (missing.length) {
    throw new Error(
      `Kolom wajib tidak ditemukan: ${missing.map((f) => REQUIRED[f]).join(", ")}`,
    );
  }

  let total = 0;
  raw.forEach((r, i) => {
    const v: Partial<Record<Field, unknown>> = {};
    for (const [h, f] of map) v[f] = r[h];
    if (Object.values(v).every((x) => text(x) === "")) return; // lewati baris kosong
    total++;

    const parsed = RowSchema.safeParse({
      name: text(v.name),
      gender: GENDER[norm(v.gender)],
      birth_date: parseDate(v.birth_date),
      phone: normPhone(v.phone),
      address: text(v.address),
      patient_group: text(v.patient_group) || null,
      is_new: norm(v.patient_type) === "baru", // selain "Baru" dianggap pasien lama
    });
    const row = i + 2; // baris 1 = header
    if (parsed.success) rows.push({ row, data: parsed.data });
    else
      errors.push({
        row,
        message: parsed.error.issues.map((x) => x.message).join("; "),
      });
  });

  return { rows, errors, total };
}
