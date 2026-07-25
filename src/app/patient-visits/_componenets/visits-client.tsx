"use client";

import React, { useState, useMemo } from "react";
import { CalendarIcon, ClipboardList } from "lucide-react";
import { SectionHeader } from "@/components/section/section-header";
import { Field } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { endOfDay, format, isWithinInterval, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { ColumnDef } from "@tanstack/react-table";
import { VisitsSchema } from "../schema";
import { VisitsForm } from "./visits-form";

const columns: ColumnDef<VisitsSchema>[] = [
  {
    header: "",
    accessorKey: "",
  },
];

export default function VisitSClient({
  initialPatient,
  initialStaff,
  initialTreatment,
  initialVisits,
}: any) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAllertDeleteOpen, setIsAlertDeleteOpen] = useState(false);

  const [selectedVisits, setSelectedVisits] = useState<VisitsSchema | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const [isEditVisit, setIsEditVisit] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });
  // const filteredVisits = useMemo(() => {
  //   if (!date?.from) return initialVisits;
  //   return initialVisits.filter((visit: any) => {
  //     const visitDate = new Date(visit.date);
  //     if (date.from && date.to) {
  //       return isWithinInterval(visitDate, {
  //         start: startOfDay(date.from),
  //         end: endOfDay(date.to),
  //       });
  //     }
  //     if (date.from) {
  //       return visitDate.toDateString() === date.from.toDateString();
  //     }
  //     return true;
  //   });
  // }, [date, initialVisits]);

  const handleOpenAdd = () => {
    setSelectedVisits(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (row: any) => {
    setIsEditVisit(row);
    setIsFormOpen(true);
  };

  return (
    <div className="mx-auto flex w-full flex-col gap-6 p-4 md:p-6">
      <SectionHeader
        title="Operasional Klinik"
        description="Data kunjungan dan transaksi hari ini."
        icon={ClipboardList}
        actionLabel="Registrasi Pasien"
        onAction={handleOpenAdd}
      />

      <Field className="mx-auto w-60">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker-range"
              className="justify-start px-2.5 font-normal"
            >
              <CalendarIcon />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd MMMM yyyy", { locale: id })} -{" "}
                    {format(date.to, "dd MMMM yyyy", { locale: id })}
                  </>
                ) : (
                  format(date.from, "dd MMMM yyyy", { locale: id })
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>
      </Field>

      {/* === TABLE === */}
      <div className="flex-1 min-h-0">
        {/* === MOBILE VIEW === */}
        {/*  */}

        {/* === DESKTOP VIEW === */}
        {/*  */}
      </div>

      {/* === FORM === */}
      <VisitsForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editData={selectedVisits}
        initialPatient={initialPatient}
      />

      {/* === DELETE ALERT === */}
      {/*  */}
    </div>
  );
}
