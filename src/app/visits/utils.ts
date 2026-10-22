// Konstanta jam shift (WIB)
export const SHIFT_TIMES = {
  PAGI: { start: "07:00", end: "14:00" },
  SORE: { start: "14:00", end: "21:00" },
  MALAM: { start: "21:00", end: "07:00" },
};

// Fungsi penentu shift berdasarkan waktu (WIB)
export const getShiftFromTime = (timestamp: string): string => {
  // Convert timestamp to local time (WIB)
  const date = new Date(timestamp);

  // Format waktu dengan menit
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Hitung total menit dari 00:00
  const totalMinutes = hours * 60 + minutes;

  // Range waktu (dalam menit)
  const PAGI_START = 7 * 60; // 07:00
  const PAGI_END = 14 * 60; // 14:00
  const SORE_START = 14 * 60; // 14:00
  const SORE_END = 21 * 60; // 21:00
  const MALAM_START = 21 * 60; // 21:00
  const MALAM_END = 7 * 60 + 60; // 07:00 next day

  if (totalMinutes >= PAGI_START && totalMinutes < PAGI_END) {
    return "Pagi";
  } else if (totalMinutes >= SORE_START && totalMinutes < SORE_END) {
    return "Sore";
  } else if (totalMinutes >= MALAM_START || totalMinutes < MALAM_END) {
    return "Malam";
  }

  throw new Error("Invalid time format");
};

export const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
