import { addDays, format, isSameDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  SHIFTS,
  isRoomCare,
  type OtcSaleRow,
  type VisitRow,
} from "@/app/visits/schema";
import {
  inDateRange,
  type VisitFilters,
} from "@/app/visits/_components/filters-visit";
import type { DutyEntry } from "@/app/visits/data";

// ===== KONFIGURASI: ubah di sini, bukan di logika =====
const CLINIC_NAME = "Klinik Pratama Rahayu Medika";

type Stats = Record<
  "total" | "umum" | "bpjs" | "rujuk" | "ranap" | "hv" | "suket",
  number
>;

const STAT_LABELS: Record<keyof Stats, string> = {
  total: "Total Pasien",
  umum: "Rajal Umum",
  bpjs: "Rajal BPJS",
  rujuk: "Rujukan",
  ranap: "Rawat Inap",
  hv: "Home Visit",
  suket: "Suket Sehat",
};

// baris statistik yang tampil di tiap bagian
const STAT_FIELDS: Record<"umum" | "shift" | "gigi", (keyof Stats)[]> = {
  umum: ["total", "umum", "bpjs", "rujuk", "ranap", "hv", "suket"],
  shift: ["total", "umum", "bpjs", "rujuk", "suket"],
  gigi: ["total", "umum", "bpjs", "rujuk"],
};

// kerangka petugas hari berikutnya (diisi manual di kotak review)
const NEXT_SCHEDULE: Record<(typeof SHIFTS)[number], string[]> = {
  Pagi: ["Dokter Umum", "Pendaftaran", "Perawat Umum", "Farmasi"],
  Sore: [
    "Dokter Umum",
    "Dokter Gigi",
    "Pendaftaran",
    "Perawat Umum",
    "Perawat Gigi",
    "Farmasi",
  ],
  Malam: ["Perawat Umum"],
};

// ===== HELPER TEKS (bisa dipakai laporan lain) =====
export const kv = (label: string, value: string | number) =>
  `${label} : ${value}`;
export const block = (title: string, lines: string[]) => [title, ...lines, ""];
export const numbered = (items: string[]) =>
  items.length ? items.map((s, i) => `${i + 1}. ${s}`) : ["-"];
export const tally = (xs: (string | undefined)[]) => {
  const m = new Map<string, number>();
  for (const x of xs) if (x) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m]
    .sort((a, b) => b[1] - a[1])
    .map(([name, n]) => `${name} : ${n}`);
};
const uniq = (xs: (string | null | undefined)[]) => [
  ...new Set(xs.filter((x): x is string => !!x)),
];
const greeting = (h = new Date().getHours()) =>
  h >= 18 || h < 5 ? "malam" : h < 11 ? "pagi" : h < 15 ? "siang" : "sore";

const longDate = (d: Date) =>
  format(d, "EEEE, d MMMM yyyy", { locale: idLocale });

const rp = (n: number) => `Rp${n.toLocaleString("id-ID")}`;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const shiftsOf = (f: VisitFilters): readonly string[] =>
  f.shift === "all" ? SHIFTS : [f.shift];
const merge = (pool: VisitRow[], visits: VisitRow[]) => [
  ...new Map([...pool, ...visits].map((v) => [v.id, v])).values(),
];
const dayLabel = (f: VisitFilters) => {
  const { from, to } = f.range ?? {};
  return from && to && !isSameDay(from, to)
    ? `${longDate(from)} - ${longDate(to)}`
    : longDate(to ?? from ?? new Date());
};

const rosterNames = (
  roster: DutyEntry[],
  f: VisitFilters,
  shift: string,
  roles: string[],
) =>
  uniq(
    roster
      .filter(
        (r) =>
          r.shift === shift && roles.includes(r.role) && inDateRange(r.date, f),
      )
      .map((r) => r.name),
  ).join(", ");

// ===== PERHITUNGAN =====
type Ctx = {
  visits: VisitRow[];
  all: VisitRow[];
  sales: OtcSaleRow[];
  f: VisitFilters;
  roster?: DutyEntry[];
};

type ShiftCtx = Ctx & { shift: string; vs: VisitRow[] };

function countStats(vs: VisitRow[]): Stats {
  const out = vs.filter((v) => !isRoomCare(v.care)); // ranap & home visit dihitung terpisah
  const rajal = out.filter(
    (v) => v.care !== "Rujuk" && v.care !== "Surat Sehat",
  );
  const care = (c: string) => vs.filter((v) => v.care === c).length;
  return {
    total: out.length,
    umum: rajal.filter((v) => v.guarantor === "Mandiri").length,
    bpjs: rajal.filter((v) => v.guarantor === "BPJS").length,
    rujuk: care("Rujuk"),
    suket: care("Surat Sehat"),
    ranap: care("Rawat Inap"),
    hv: care("Home Visit"),
  };
}

const statLines = (s: Stats, fields: (keyof Stats)[]) =>
  fields.map((k) => kv(STAT_LABELS[k], s[k]));

const treatmentRows = (c: Ctx, dept: string, shift?: string) =>
  c.all
    .filter((v) => v.department === dept)
    .flatMap((v) => (v.visit_treatments ?? []).map((t) => ({ v, t })))
    .filter(
      ({ t }) =>
        inDateRange(t.treatment_date, c.f) &&
        (c.f.shift === "all" || t.treatment_shift === c.f.shift) &&
        (!shift || t.treatment_shift === shift),
    );

const treatmentNames = (c: Ctx, dept: string, shift?: string) =>
  treatmentRows(c, dept, shift).map(({ t }) => t.treatments?.name);

const byDept = (
  c: ShiftCtx,
  dept: string,
  pick: (v: VisitRow) => string | undefined,
) => uniq(c.vs.filter((v) => v.department === dept).map(pick)).join(", ");

// farmasi = apoteker resep + kasir + petugas penjualan apotek
const pharmacy = (c: ShiftCtx) =>
  uniq([
    ...c.all
      .flatMap((v) => v.visit_prescription ?? [])
      .filter(
        (r) =>
          r.prescription_shift === c.shift &&
          inDateRange(r.prescription_date, c.f),
      )
      .map((r) => r.pharmacist?.name),
    ...c.all
      .flatMap((v) => v.visit_payment ?? [])
      .filter(
        (p) => p.payment_shift === c.shift && inDateRange(p.payment_date, c.f),
      )
      .map((p) => p.cashier?.name),
    ...c.sales
      .filter((s) => s.sale_shift === c.shift)
      .map((s) => s.staff?.name),
  ]).join(", ");

// satu baris petugas = satu entri; required = tetap tampil "-" bila kosong
const STAFF_LINES: {
  label: string;
  roles: string[];
  names: (c: ShiftCtx) => string;
  required?: boolean;
}[] = [
  {
    label: "Dokter Umum",
    roles: ["dokter umum"],
    names: (c) => byDept(c, "Umum", (v) => v.doctor?.name),
  },
  {
    label: "Dokter Gigi",
    roles: ["dokter gigi"],
    names: (c) => byDept(c, "Gigi", (v) => v.doctor?.name),
  },
  {
    label: "Pendaftaran",
    roles: ["pendaftaran"],
    names: (c) => uniq(c.vs.map((v) => v.registration_staff?.name)).join(", "),
  },
  {
    label: "Perawat Umum",
    roles: ["perawat umum"],
    names: (c) => byDept(c, "Umum", (v) => v.nurse?.name),
    required: true,
  },
  {
    label: "Perawat Gigi",
    roles: ["perawat gigi"],
    names: (c) => byDept(c, "Gigi", (v) => v.nurse?.name),
  },
  { label: "Farmasi", roles: ["farmasi", "apoteker"], names: pharmacy },
];

// ===== PERAKITAN LAPORAN =====
export function renderPendaftaran(
  visits: VisitRow[],
  sales: OtcSaleRow[],
  f: VisitFilters,
  pool: VisitRow[] = [],
  roster: DutyEntry[] = [],
) {
  const all = merge(pool, visits);
  const c: Ctx = { visits, all, sales, f, roster };
  const shifts = shiftsOf(f);
  const dept = (d: string) => visits.filter((v) => v.department === d);

  const poliUmum = block(
    "POLI UMUM",
    statLines(countStats(dept("Umum")), STAT_FIELDS.umum),
  );

  const umumPerShift = shifts.flatMap((s) => {
    const vs = dept("Umum").filter((v) => v.admission_shift === s);
    const tx = treatmentNames(c, "Umum", s);
    if (!vs.length && !tx.length) return [];
    return block(`SHIFT ${s.toUpperCase()}`, [
      ...statLines(countStats(vs), STAT_FIELDS.shift),
      "Tindakan :",
      ...numbered(tally(tx)),
    ]);
  });

  const poliGigi = block("POLI GIGI", [
    ...statLines(countStats(dept("Gigi")), STAT_FIELDS.gigi),
    "Tindakan :",
    ...numbered(tally(treatmentNames(c, "Gigi"))),
  ]);

  const petugas = shifts.flatMap((s) => {
    const sc: ShiftCtx = {
      ...c,
      shift: s,
      vs: visits.filter((v) => v.admission_shift === s),
    };
    return block(
      `SHIFT ${s.toUpperCase()}`,
      STAFF_LINES.flatMap(({ label, roles, names, required }) => {
        const n = rosterNames(roster, f, s, roles) || names(sc);
        return n || required ? [kv(label, n || "-")] : [];
      }),
    );
  });

  const schedule = Object.entries(NEXT_SCHEDULE).flatMap(([s, roles]) =>
    block(
      `SHIFT ${s.toUpperCase()}`,
      roles.map((r) => `${r} :`),
    ),
  );

  const day = f.range?.to ?? f.range?.from ?? new Date();

  return [
    `Selamat ${greeting()} Bapak/Ibu`,
    "Izin menyampaikan laporan pasien",
    `${CLINIC_NAME},`,
    dayLabel(f),
    "",
    ...poliUmum,
    ...umumPerShift,
    ...poliGigi,
    "PETUGAS :",
    ...petugas,
    "PETUGAS PAGI BERIKUTNYA",
    longDate(addDays(day, 1)),
    "",
    ...schedule,
  ]
    .join("\n")
    .trimEnd();
}

export function renderPerawat(
  visits: VisitRow[],
  f: VisitFilters,
  pool: VisitRow[] = [],
  roster: DutyEntry[] = [],
) {
  const c: Ctx = { visits, all: merge(pool, visits), sales: [], f };
  const umum = visits.filter((v) => v.department === "Umum");

  const sections = shiftsOf(f).flatMap((s) => {
    const vs = umum.filter((v) => v.admission_shift === s);
    const rows = treatmentRows(c, "Umum", s);
    if (!vs.length && !rows.length) return [];
    const petugas =
      rosterNames(roster, f, s, ["perawat umum"]) ||
      uniq(vs.map((v) => v.nurse?.name)).join(", ") ||
      uniq(rows.map(({ t }) => t.operator?.name)).join(", ") ||
      "-";
    return block(`SHIFT ${s.toUpperCase()}`, [
      kv("Petugas", petugas),
      ...statLines(countStats(vs), STAT_FIELDS.shift),
      "Tindakan :",
      ...numbered(
        rows.map(
          ({ v, t }) =>
            `${v.patients?.name ?? "-"} / ${t.treatments?.name ?? "-"} / ${v.guarantor === "BPJS" ? "BPJS" : "Umum"}`,
        ),
      ),
    ]);
  });

  return [
    "LAPORAN PERAWAT UMUM HARIAN",
    kv("Hari", dayLabel(f)),
    "",
    ...(sections.length ? sections : ["Belum ada data.", ""]),
    "Terimakasih",
  ].join("\n");
}

export function renderFarmasi(
  visits: VisitRow[],
  f: VisitFilters,
  pool: VisitRow[] = [],
  roster: DutyEntry[] = [],
) {
  const rx = merge(pool, visits)
    .flatMap((v) => (v.visit_prescription ?? []).map((r) => ({ v, r })))
    .filter(({ r }) => inDateRange(r.prescription_date, f));

  // BPJS dihitung sendiri (semua jenis); non-BPJS dibagi Biasa / Racikan
  const KINDS = [
    ["Biasa", "Regular"],
    ["Racikan", "Racikan"],
    ["BPJS", "BPJS"],
  ] as const;

  const sections = shiftsOf(f).flatMap((s) => {
    const rows = rx.filter(({ r }) => r.prescription_shift === s);
    if (!rows.length) return [];
    const n = (dept: string, kind: string) =>
      rows.filter(
        ({ v, r }) =>
          v.department === dept &&
          (kind === "BPJS"
            ? v.guarantor === "BPJS"
            : v.guarantor !== "BPJS" && r.prescription_type === kind),
      ).length;
    return [
      kv(
        `Petugas ${s}`,
        rosterNames(roster, f, s, ["farmasi", "apoteker"]) ||
          uniq(rows.map(({ r }) => r.pharmacist?.name)).join(", ") ||
          "-",
      ),
      kv("Jumlah Pasien", rows.length),
      "Pelayanan Resep :",
      ...["Umum", "Gigi"].flatMap((d) =>
        KINDS.map(([label, kind]) => `- ${d} ${label} : ${n(d, kind)}`),
      ),
      "",
    ];
  });

  return [
    "LAPORAN FARMASI HARIAN",
    kv("Tanggal", dayLabel(f)),
    "",
    ...(sections.length ? sections : ["Belum ada resep.", ""]),
    "Terimakasih",
  ].join("\n");
}

export function renderKeuangan(
  visits: VisitRow[],
  sales: OtcSaleRow[],
  f: VisitFilters,
  pool: VisitRow[] = [],
) {
  const pays = merge(pool, visits)
    .flatMap((v) => (v.visit_payment ?? []).map((p) => ({ v, p })))
    .filter(
      ({ p }) =>
        inDateRange(p.payment_date, f) &&
        (f.shift === "all" || p.payment_shift === f.shift),
    );

  const by = (m: string) => pays.filter(({ p }) => p.payment_method === m);
  const total = (rows: typeof pays) => sum(rows.map(({ p }) => p.amount));
  const bpjs = by("BPJS");
  const owed = pays.filter(({ p }) => p.billed_amount > p.amount);
  const otc = sum(sales.map((s) => s.amount));
  const dept = (d: string) => bpjs.filter(({ v }) => v.department === d).length;

  const text = [
    "LAPORAN KEUANGAN HARIAN",
    kv("Hari", dayLabel(f)),
    kv("Shift", f.shift === "all" ? "Semua shift" : f.shift),
    kv(
      "Petugas",
      uniq([
        ...pays.map(({ p }) => p.cashier?.name),
        ...sales.map((s) => s.staff?.name),
      ]).join(", ") || "-",
    ),
    "Saldo Awal :",
    kv("Saldo Masuk", rp(total(pays))),
    kv("- Cash", rp(total(by("Cash")))),
    kv("- Qris", rp(total(by("QRIS")))),
    kv("- Transfer", rp(total(by("Transfer")))),
    `${kv("- BPJS", rp(total(bpjs)))} ( ${dept("Umum")} Umum, ${dept("Gigi")} Gigi )`,
    ...(otc
      ? [kv("- Penjualan Apotek (cara bayar belum dicatat)", rp(otc))]
      : []),
    "Saldo Keluar :",
    "Saldo Setor :",
    "Saldo Sisa :",
    kv("Piutang", rp(sum(owed.map(({ p }) => p.billed_amount - p.amount)))),
    ...numbered(
      owed.map(
        ({ v, p }) =>
          `${v.patients?.name ?? "-"} ${rp(p.billed_amount - p.amount)}`,
      ),
    ),
  ].join("\n");

  return {
    text,
    warnings: [
      "Saldo Awal, Keluar, Setor, dan Sisa belum terisi (isi manual sebelum dikirim)",
      ...(otc
        ? [
            `Penjualan apotek ${rp(otc)} belum masuk rincian karena belum ada cara bayar`,
          ]
        : []),
    ],
  };
}
