"use client";

import { SectionHeader } from "@/components/section/section-header";
import { SectionTable } from "@/components/section/section-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Download, Edit3, Trash2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 p-4 md:p-6 h-[calc(100vh-64px)] overflow-hidden">
      <SectionHeader
        title="Staff Attendance"
        description="Manage daily clinic attendance."
        icon={CalendarIcon}
        actionLabel="Add attendance"
      />

      <div className="flex justify-between">
        <div className="w-full"></div>
        <div className="flex gap-2">
          <Field className="mx-auto w-60">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="date-picker-range"
                  className="justify-start px-2.5 font-normal"
                >
                  <CalendarIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" numberOfMonths={1} />
              </PopoverContent>
            </Popover>
          </Field>
          <Button
            className="shrink-0 shadow-sm cursor-pointer flex items-center"
            variant="outline"
          >
            <Download />
            <div className="hidden md:block"> Export </div>
          </Button>
        </div>
      </div>

      <SectionTable
        data={["loading"]}
        header={[]}
        onEdit={() => []}
        onDelete={() => []}
        mobileRender={(row: any) => (
          <div
            key={row.id}
            className="bg-background rounded-xl shadow-sm space-y-3"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <div className="font-bold">{row.date}</div>
              <Badge variant="secondary">{row.shift}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm"></div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => row}>
                <Edit3 className="h-4 w-4 mr-2" /> Edit
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  row;
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Hapus
              </Button>
            </div>
          </div>
        )}
      />
    </div>
  );
}
