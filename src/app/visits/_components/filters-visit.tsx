"use client";

import { endOfDay, format, isSameDay, startOfDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, FilterIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CARE_OPTIONS, OtcSaleRow, VisitRow } from "../schema";

export type ShiftFilter = "all" | "Pagi" | "Sore" | "Malam";

export type VisitFilters = {
  range: DateRange | undefined;
  shift: ShiftFilter;
  department: string[];
  guarantor: string[];
  care: string[];
};

export const getDefaultFilters = (): VisitFilters => {
  const today = new Date();
  return {
    range: { from: today, to: today }, // default: hari ini
    shift: "all",
    department: [],
    guarantor: [],
    care: [],
  };
};

const SHIFT_OPTIONS = [
  { value: "Pagi", label: "Pagi" },
  { value: "Sore", label: "Sore" },
  { value: "Malam", label: "Malam" },
] as const;

const DEPARTMENTS = ["Umum", "Gigi"];
const GUARANTORS = ["Mandiri", "BPJS"];

const toggle = (list: string[], v: string) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

const fmt = (d: Date) => format(d, "d MMM yyyy", { locale: idLocale });


// ================
// === function ===
// ================
export const toDate = (s: string) =>
  new Date(!s.includes("T") || /(Z|[+-]\d{2}:?\d{2})$/.test(s) ? s : `${s}Z`);

export function filterVisits(visits: VisitRow[], f: VisitFilters): VisitRow[] {
  const from = f.range?.from && startOfDay(f.range.from);
  const to = f.range?.from && endOfDay(f.range.to ?? f.range.from);

  return visits.filter((v) => {
    if (from && to) {
      const d = toDate(v.admission_date);
      if (d < from || d > to) return false;
    }
    if (f.shift !== "all" && v.admission_shift !== f.shift) return false;
    if (f.department.length && !f.department.includes(v.department))
      return false;
    if (f.guarantor.length && !f.guarantor.includes(v.guarantor)) return false;
    if (f.care.length && !(v.care && f.care.includes(v.care))) return false;
    return true;
  });
}

export function filterOtcSales(
  sales: OtcSaleRow[],
  f: VisitFilters,
): OtcSaleRow[] {
  // sale_date berupa "yyyy-MM-dd", jadi dibandingkan sebagai teks agar bebas masalah zona waktu
  const from = f.range?.from && format(f.range.from, "yyyy-MM-dd");
  const to = f.range?.from && format(f.range.to ?? f.range.from, "yyyy-MM-dd");

  return sales.filter((s) => {
    const date = s.sale_date.slice(0, 10);
    if (from && to && (date < from || date > to)) return false;
    if (f.shift !== "all" && s.sale_shift !== f.shift) return false;
    return true;
  });
}

function CheckGroup({
  title,
  options,
  selected,
  onChange,
  twoCols,
}: {
  title: string;
  options: readonly string[];
  selected: string[];
  onChange: (v: string[]) => void;
  twoCols?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <div className={twoCols ? "grid grid-cols-2 gap-2" : "flex gap-4"}>
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selected.includes(o)}
              onCheckedChange={() => onChange(toggle(selected, o))}
            />
            {o}
          </label>
        ))}
      </div>
    </div>
  );
}

export function VisitFilterBar({
  value,
  onChange,
}: {
  value: VisitFilters;
  onChange: (v: VisitFilters) => void;
}) {
  const set = <K extends keyof VisitFilters>(key: K, v: VisitFilters[K]) =>
    onChange({ ...value, [key]: v });

  const { range } = value;
  const rangeLabel = !range?.from
    ? "Pilih tanggal"
    : !range.to || isSameDay(range.from, range.to)
      ? fmt(range.from)
      : `${fmt(range.from)} - ${fmt(range.to)}`;

  const activeCount =
    value.department.length + value.guarantor.length + value.care.length;

  return (
    <div className="flex w-full flex-wrap gap-2 md:w-auto">
      {/* Date range */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start font-normal">
            <CalendarIcon className="size-4" />
            {rangeLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="range"
            locale={idLocale}
            numberOfMonths={2}
            selected={value.range}
            defaultMonth={value.range?.from}
            onSelect={(r) => set("range", r)}
          />
        </PopoverContent>
      </Popover>

      {/* Shift */}
      <Select
        value={value.shift}
        onValueChange={(v) => set("shift", v as ShiftFilter)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Shift" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua shift</SelectItem>
          {SHIFT_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filter checkbox */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">
            {activeCount > 0 ? (
              <Badge variant="secondary">{activeCount}</Badge>
            ) : (
              <FilterIcon className="size-4" />
            )}
            Filter
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 space-y-4">
          <CheckGroup
            title="Departemen"
            options={DEPARTMENTS}
            selected={value.department}
            onChange={(v) => set("department", v)}
          />
          <CheckGroup
            title="Guarantor"
            options={GUARANTORS}
            selected={value.guarantor}
            onChange={(v) => set("guarantor", v)}
          />
          <CheckGroup
            title="Care"
            options={CARE_OPTIONS}
            selected={value.care}
            onChange={(v) => set("care", v)}
            twoCols
          />
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() =>
              onChange({ ...value, department: [], guarantor: [], care: [] })
            }
          >
            Reset filter
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
