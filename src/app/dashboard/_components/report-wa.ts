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
import { outstanding } from "@/app/visits/schema";
import type { CashSummary } from "@/app/dashboard/cash-data";

const CLINIC_NAME = "Klinik Pratama Rahayu Medika";

type Shift = (typeof SHIFTS)[number];

const SHIFT_LAPORAN: readonly Shift[] = ["Pagi", "Sore"];

const ROLE_FARMASI = "farmasi";
const ROLE_APOTEKER = "apoteker";

const NEXT_DAY_STAFF_TEMPLATE: Record<Shift, string[]> = {
  Pagi: ["Dokter Umum", "Pendaftaran", "Perawat Umum", "Farmasi", "Apoteker"],
  Sore: [
    "Dokter Umum",
    "Dokter Gigi",
    "Pendaftaran",
    "Perawat Umum",
    "Perawat Gigi",
    "Farmasi",
    "Apoteker",
  ],
  Malam: ["Perawat Umum"],
};

type StatKey =
  | "total"
  | "mandiri"
  | "bpjs"
  | "rujuk"
  | "ranap"
  | "hv"
  | "suket";

const dihitungSebagaiRajal = (visit: VisitRow) =>
  visit.care !== "Rujuk" && visit.care !== "Surat Sehat";

const STATISTIK: Record<
  StatKey,
  { label: string; dihitung: (visit: VisitRow) => boolean }
> = {
  total: { label: "Total Pasien", dihitung: () => true },

  mandiri: {
    label: "Rajal Mandiri",
    dihitung: (visit) =>
      dihitungSebagaiRajal(visit) && visit.guarantor === "Mandiri",
  },
  bpjs: {
    label: "Rajal BPJS",
    dihitung: (visit) =>
      dihitungSebagaiRajal(visit) && visit.guarantor === "BPJS",
  },

  rujuk: { label: "Rujukan", dihitung: (visit) => visit.care === "Rujuk" },
  ranap: {
    label: "Rawat Inap",
    dihitung: (visit) => visit.care === "Rawat Inap",
  },
  hv: { label: "Home Visit", dihitung: (visit) => visit.care === "Home Visit" },
  suket: {
    label: "Suket Sehat",
    dihitung: (visit) => visit.care === "Surat Sehat",
  },
};

const KOLOM_POLI_UMUM: StatKey[] = [
  "total",
  "mandiri",
  "bpjs",
  "rujuk",
  "ranap",
  "hv",
  "suket",
];
const KOLOM_POLI_GIGI: StatKey[] = ["total", "mandiri", "bpjs", "rujuk"];

const statLines = (visits: VisitRow[], keys: StatKey[]) =>
  keys.map((key) =>
    formatKeyValue(
      STATISTIK[key].label,
      visits.filter(STATISTIK[key].dihitung).length,
    ),
  );

export const formatKeyValue = (label: string, value: string | number) =>
  `${label} : ${value}`;

export const titledSection = (title: string, lines: string[]) => [
  title,
  ...lines,
  "",
];

export const numberedList = (items: string[]) =>
  items.length ? items.map((item, index) => `${index + 1}. ${item}`) : ["-"];

export const tallyLines = (names: (string | undefined)[]) => {
  const countByName = new Map<string, number>();
  for (const name of names) {
    if (name) countByName.set(name, (countByName.get(name) ?? 0) + 1);
  }
  return [...countByName]
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([name, count]) => `${name} : ${count}`);
};

/** @deprecated Alias nama lama, hapus setelah semua import diperbarui. */
export const kv = formatKeyValue;
/** @deprecated */
export const block = titledSection;
/** @deprecated */
export const numbered = numberedList;
/** @deprecated */
export const tally = tallyLines;

const uniqueValues = (values: (string | null | undefined)[]) => [
  ...new Set(values.filter((value): value is string => !!value)),
];

const getGreeting = (hour = new Date().getHours()) => {
  if (hour >= 18 || hour < 5) return "malam";
  if (hour < 11) return "pagi";
  if (hour < 15) return "siang";
  return "sore";
};

const formatLongDate = (date: Date) =>
  format(date, "EEEE, d MMMM yyyy", { locale: idLocale });

const formatRupiah = (amount: number) => `Rp${amount.toLocaleString("id-ID")}`;

const sumNumbers = (numbers: number[]) =>
  numbers.reduce((total, value) => total + value, 0);

const formatDateRangeLabel = (filters: VisitFilters) => {
  const { from, to } = filters.range ?? {};
  if (from && to && !isSameDay(from, to)) {
    return `${formatLongDate(from)} - ${formatLongDate(to)}`;
  }
  return formatLongDate(to ?? from ?? new Date());
};

const mergeVisits = (poolVisits: VisitRow[], currentVisits: VisitRow[]) => [
  ...new Map(
    [...poolVisits, ...currentVisits].map((visit) => [visit.id, visit]),
  ).values(),
];

const getDutyRosterNames = (
  roster: DutyEntry[],
  filters: VisitFilters,
  shift: string,
  roles: string[],
) =>
  uniqueValues(
    roster
      .filter(
        (entry) =>
          entry.shift === shift &&
          roles.includes(entry.role) &&
          inDateRange(entry.date, filters),
      )
      .map((entry) => entry.name),
  ).join(", ");

const findTreatmentRows = (
  allVisits: VisitRow[],
  filters: VisitFilters,
  department: string,
  shift?: string,
) =>
  allVisits
    .filter((visit) => visit.department === department)
    .flatMap((visit) =>
      (visit.visit_treatments ?? []).map((treatment) => ({ visit, treatment })),
    )
    .filter(
      ({ treatment }) =>
        inDateRange(treatment.treatment_date, filters) &&
        (!shift || treatment.treatment_shift === shift),
    );

export function renderPendaftaran(
  visits: VisitRow[],
  sales: OtcSaleRow[],
  filters: VisitFilters,
  poolVisits: VisitRow[] = [],
  roster: DutyEntry[] = [],
) {
  const allVisits = mergeVisits(poolVisits, visits);
  const umumVisits = visits.filter((visit) => visit.department === "Umum");
  const gigiVisits = visits.filter((visit) => visit.department === "Gigi");

  const poliUmum = titledSection(
    "POLI UMUM",
    statLines(umumVisits, KOLOM_POLI_UMUM),
  );

  const poliUmumPerShift = SHIFT_LAPORAN.flatMap((shift) => {
    const shiftVisits = umumVisits.filter(
      (visit) => visit.admission_shift === shift,
    );
    const treatmentNames = findTreatmentRows(
      allVisits,
      filters,
      "Umum",
      shift,
    ).map(({ treatment }) => treatment.treatments?.name);

    if (!shiftVisits.length && !treatmentNames.length) return [];

    return titledSection(`SHIFT ${shift.toUpperCase()}`, [
      ...statLines(shiftVisits, KOLOM_POLI_UMUM),
      "Tindakan :",
      ...numberedList(tallyLines(treatmentNames)),
    ]);
  });

  const gigiTreatmentNames = findTreatmentRows(allVisits, filters, "Gigi").map(
    ({ treatment }) => treatment.treatments?.name,
  );
  const poliGigi = titledSection("POLI GIGI", [
    ...statLines(gigiVisits, KOLOM_POLI_GIGI),
    "Tindakan :",
    ...numberedList(tallyLines(gigiTreatmentNames)),
  ]);

  const petugasPerShift = SHIFT_LAPORAN.flatMap((shift) => {
    const shiftVisits = visits.filter(
      (visit) => visit.admission_shift === shift,
    );
    const umumShift = shiftVisits.filter((v) => v.department === "Umum");
    const gigiShift = shiftVisits.filter((v) => v.department === "Gigi");

    const pilihNama = (
      jadwalPeran: string[],
      namaDariData: (string | null | undefined)[],
    ) =>
      getDutyRosterNames(roster, filters, shift, jadwalPeran) ||
      uniqueValues(namaDariData).join(", ");

    const petugasResep = allVisits
      .flatMap((visit) => visit.visit_prescription ?? [])
      .filter(
        (resep) =>
          resep.prescription_shift === shift &&
          inDateRange(resep.prescription_date, filters),
      )
      .map((resep) => resep.pharmacist?.name);
    const kasir = allVisits
      .flatMap((visit) => visit.visit_payment ?? [])
      .filter(
        (bayar) =>
          bayar.payment_shift === shift &&
          inDateRange(bayar.payment_date, filters),
      )
      .map((bayar) => bayar.cashier?.name);
    const petugasPenjualan = sales
      .filter((sale) => sale.sale_shift === shift)
      .map((sale) => sale.staff?.name);

    const daftarPetugas = [
      {
        label: "Dokter Umum",
        nama: pilihNama(
          ["dokter umum"],
          umumShift.map((v) => v.doctor?.name),
        ),
      },
      {
        label: "Dokter Gigi",
        nama: pilihNama(
          ["dokter gigi"],
          gigiShift.map((v) => v.doctor?.name),
        ),
      },
      {
        label: "Pendaftaran",
        nama: pilihNama(
          ["pendaftaran"],
          shiftVisits.map((v) => v.registration_staff?.name),
        ),
      },
      {
        label: "Perawat Umum",
        nama: pilihNama(
          ["perawat umum"],
          umumShift.map((v) => v.nurse?.name),
        ),
        wajibTampil: true,
      },
      {
        label: "Perawat Gigi",
        nama: pilihNama(
          ["perawat gigi"],
          gigiShift.map((v) => v.nurse?.name),
        ),
      },
      {
        label: "Farmasi",
        nama: pilihNama(
          [ROLE_FARMASI],
          [...petugasResep, ...kasir, ...petugasPenjualan],
        ),
      },
      {
        label: "Apoteker",
        nama: pilihNama([ROLE_APOTEKER], []),
      },
    ];

    return titledSection(
      `SHIFT ${shift.toUpperCase()}`,
      daftarPetugas
        .filter((petugas) => petugas.nama || petugas.wajibTampil)
        .map((petugas) => formatKeyValue(petugas.label, petugas.nama || "-")),
    );
  });

  const nextDayTemplate = Object.entries(NEXT_DAY_STAFF_TEMPLATE).flatMap(
    ([shift, roles]) =>
      titledSection(
        `SHIFT ${shift.toUpperCase()}`,
        roles.map((role) => `${role} :`),
      ),
  );
  const reportDay = filters.range?.to ?? filters.range?.from ?? new Date();
  const nextDay = addDays(reportDay, 1);

  return [
    `Selamat ${getGreeting()} Bapak/Ibu`,
    "Izin menyampaikan laporan pasien",
    `${CLINIC_NAME},`,
    formatDateRangeLabel(filters),
    "",
    ...poliUmum,
    ...poliUmumPerShift,
    ...poliGigi,
    "PETUGAS :",
    ...petugasPerShift,
    "PETUGAS PAGI BERIKUTNYA",
    formatLongDate(nextDay),
    "",
    ...nextDayTemplate,
  ]
    .join("\n")
    .trimEnd();
}

export function renderPerawat(
  visits: VisitRow[],
  filters: VisitFilters,
  poolVisits: VisitRow[] = [],
  roster: DutyEntry[] = [],
) {
  const allVisits = mergeVisits(poolVisits, visits);
  const umumVisits = visits.filter((visit) => visit.department === "Umum");

  const shiftSections = SHIFT_LAPORAN.flatMap((shift) => {
    const shiftVisits = umumVisits.filter(
      (visit) => visit.admission_shift === shift,
    );
    const treatmentRows = findTreatmentRows(allVisits, filters, "Umum", shift);
    if (!shiftVisits.length && !treatmentRows.length) return [];

    const nurseNames =
      getDutyRosterNames(roster, filters, shift, ["perawat umum"]) ||
      uniqueValues(shiftVisits.map((visit) => visit.nurse?.name)).join(", ") ||
      uniqueValues(
        treatmentRows.map(({ treatment }) => treatment.operator?.name),
      ).join(", ") ||
      "-";

    const treatmentLines = treatmentRows.map(({ visit, treatment }) => {
      const patientName = visit.patients?.name ?? "-";
      const treatmentName = treatment.treatments?.name ?? "-";
      const guarantorLabel = visit.guarantor === "BPJS" ? "BPJS" : "Umum";
      return `${patientName} / ${treatmentName} / ${guarantorLabel}`;
    });

    return titledSection(`SHIFT ${shift.toUpperCase()}`, [
      formatKeyValue("Petugas", nurseNames),
      ...statLines(shiftVisits, KOLOM_POLI_UMUM),
      "Tindakan :",
      ...numberedList(treatmentLines),
    ]);
  });

  return [
    "LAPORAN PERAWAT UMUM HARIAN",
    formatKeyValue("Hari", formatDateRangeLabel(filters)),
    "",
    ...(shiftSections.length ? shiftSections : ["Belum ada data.", ""]),
    "Terimakasih",
  ].join("\n");
}

const PRESCRIPTION_KINDS = [
  { label: "Regular", kind: "Regular" },
  { label: "Racikan", kind: "Racikan" },
  { label: "BPJS", kind: "BPJS" },
] as const;

const PRESCRIPTION_DEPARTMENTS = ["Umum", "Gigi"] as const;

export function renderFarmasi(
  visits: VisitRow[],
  filters: VisitFilters,
  poolVisits: VisitRow[] = [],
  roster: DutyEntry[] = [],
) {
  const prescriptionEntries = mergeVisits(poolVisits, visits)
    .flatMap((visit) =>
      (visit.visit_prescription ?? []).map((prescription) => ({
        visit,
        prescription,
      })),
    )
    .filter(({ prescription }) =>
      inDateRange(prescription.prescription_date, filters),
    );

  const shiftSections = SHIFT_LAPORAN.flatMap((shift) => {
    const shiftEntries = prescriptionEntries.filter(
      ({ prescription }) => prescription.prescription_shift === shift,
    );
    const shiftVisits = visits.filter(
      (visit) =>
        visit.admission_shift === shift && STATISTIK.total.dihitung(visit),
    );
    if (!shiftEntries.length && !shiftVisits.length) return [];

    const countPrescriptions = (department: string, kind: string) =>
      shiftEntries.filter(({ visit, prescription }) => {
        if (visit.department !== department) return false;
        return kind === "BPJS"
          ? visit.guarantor === "BPJS"
          : visit.guarantor !== "BPJS" &&
              prescription.prescription_type === kind;
      }).length;

    const pharmacistNames =
      getDutyRosterNames(roster, filters, shift, [ROLE_FARMASI]) ||
      uniqueValues(
        shiftEntries.map(({ prescription }) => prescription.pharmacist?.name),
      ).join(", ") ||
      "-";

    return [
      formatKeyValue(`Petugas ${shift}`, pharmacistNames),
      formatKeyValue("Jumlah Pasien", shiftVisits.length),
      ...PRESCRIPTION_DEPARTMENTS.map(
        (department) =>
          `- Poli ${department} : ${shiftVisits.filter((visit) => visit.department === department).length}`,
      ),
      "Pelayanan Resep :",
      ...PRESCRIPTION_DEPARTMENTS.flatMap((department) =>
        PRESCRIPTION_KINDS.map(
          ({ label, kind }) =>
            `- ${department} ${label} : ${countPrescriptions(department, kind)}`,
        ),
      ),
      "",
    ];
  });

  return [
    "LAPORAN FARMASI HARIAN",
    formatKeyValue("Tanggal :", formatDateRangeLabel(filters)),
    "",
    ...(shiftSections.length ? shiftSections : ["Belum ada resep.", ""]),
    "Terimakasih",
  ].join("\n");
}

export function renderKeuangan(
  visits: VisitRow[],
  filters: VisitFilters,
  poolVisits: VisitRow[],
  cash: CashSummary,
) {
  const m = cash.methods;
  const owedVisits = mergeVisits(poolVisits, visits).filter(
    (v) => outstanding(v) > 0,
  );
  const balance = (amount: number) =>
    cash.configured ? formatRupiah(amount) : "";

  const text = [
    "LAPORAN KEUANGAN HARIAN",
    formatKeyValue("Hari", formatDateRangeLabel(filters)),
    formatKeyValue(
      "Shift",
      filters.shift === "all" ? "Semua shift" : filters.shift,
    ),
    formatKeyValue("Petugas", cash.staff.join(", ") || "-"),
    formatKeyValue("Saldo Awal", balance(cash.opening)),
    // BPJS tidak dihitung sebagai uang masuk, sesuai perubahanmu sebelumnya
    formatKeyValue(
      "Saldo Masuk",
      formatRupiah(sumNumbers([m.Cash, m.QRIS, m.Transfer])),
    ),
    formatKeyValue("- Cash", formatRupiah(m.Cash)),
    formatKeyValue("- Qris", formatRupiah(m.QRIS)),
    formatKeyValue("- Transfer", formatRupiah(m.Transfer)),
    `${formatKeyValue("- BPJS", formatRupiah(m.BPJS))} ( ${cash.bpjsDept.Umum} Umum, ${cash.bpjsDept.Gigi} Gigi )`,
    formatKeyValue("Saldo Keluar", formatRupiah(cash.keluar)),
    ...cash.keluarList.map((k) => `- ${k.note} : ${formatRupiah(k.amount)}`),
    formatKeyValue("Saldo Setor", formatRupiah(cash.setor)),
    formatKeyValue("Saldo Sisa", balance(cash.closing)),
    formatKeyValue(
      "Piutang",
      formatRupiah(sumNumbers(owedVisits.map(outstanding))),
    ),
    ...numberedList(
      owedVisits.map(
        (v) => `${v.patients?.name ?? "-"} ${formatRupiah(outstanding(v))}`,
      ),
    ),
  ].join("\n");

  return {
    text,
    warnings: cash.configured
      ? []
      : [
          "Saldo awal belum diatur untuk periode ini (isi lewat tombol Catat Kas)",
        ],
  };
}

const CARE_PERLU_MAKAN = ["Rawat Inap", "Home Visit"];

const JAM_MULAI_MAKAN_SORE = 13;

const toTitleCase = (text: string) =>
  text
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(
      /(^|[\s-])(\p{L})/gu,
      (_match, separator: string, letter: string) =>
        separator + letter.toUpperCase(),
    );

export function renderMakan(visits: VisitRow[], now: Date = new Date()) {
  const mealTime = now.getHours() < JAM_MULAI_MAKAN_SORE ? "Pagi" : "Sore";

  const patients = visits
    .filter(
      (visit) =>
        !!visit.care &&
        CARE_PERLU_MAKAN.includes(visit.care) &&
        !visit.discharge_date,
    )
    .map((visit) => ({
      room: visit.room?.trim() || null,
      name: toTitleCase(visit.patients?.name ?? "-"),
    }))
    .sort((a, b) => {
      if (!a.room !== !b.room) return a.room ? -1 : 1;
      return (
        (a.room ?? "").localeCompare(b.room ?? "", "id", { numeric: true }) ||
        a.name.localeCompare(b.name, "id")
      );
    });

  const patientList = patients.length
    ? patients
        .map(
          (patient, index) =>
            `${index + 1}. ${patient.room ?? "-"} / ${patient.name}`,
        )
        .join("\n\n")
    : "-";

  return [
    "Assalamu'alaikum, izin menyampaikan laporan",
    `pasien rawat inap untuk persiapan makan ${mealTime}`,
    CLINIC_NAME.toUpperCase(),
    formatLongDate(now),
    "",
    `Total Ranap Umum = ${patients.length}`,
    "",
    patientList,
    "",
    "Terima kasih",
  ].join("\n");
}
