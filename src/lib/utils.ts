import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function getCurrentShift(): "Pagi" | "Sore" | "Malam" {
  const hour = new Date().getHours();

  if (hour >= 7 && hour < 14) {
    return "Pagi";
  } else if (hour >= 14 && hour < 21) {
    return "Sore";
  } else {
    return "Malam";
  }
}


export function formatRupiah(value: number | string): string {
  const amount = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(amount)) return "Rp 0";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}


export function parseRupiah(value: string): number {
  return Number(value.replace(/[^0-9]/g, ""));
}
