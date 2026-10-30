import { subDays } from "date-fns";

export type ShiftName = "Pagi" | "Sore" | "Malam";

export function currentShift(now = new Date()): { date: Date; shift: ShiftName } {
  const h = now.getHours();
  if (h >= 8 && h < 15) return { date: now, shift: "Pagi" };
  if (h >= 15 && h < 22) return { date: now, shift: "Sore" };
  return { date: h < 8 ? subDays(now, 1) : now, shift: "Malam" };
}