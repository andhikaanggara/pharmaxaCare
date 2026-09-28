"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarIcon, Download, Edit3, Trash2 } from "lucide-react";

// UI Components
import { SectionHeader } from "@/components/section/section-header";
import { SectionTable, TableColumn } from "@/components/section/section-table";

// Actions & Types
import { AttendanceForm } from "./attendance-form";
import {
  AttendanceFormData,
  AttendanceSchema,
  GroupedAttendance,
} from "./schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateIndo } from "@/lib/utils/format";
import { ConfirmDeleteDialog } from "@/components/feedback/confirm-delete-dialog";
import { deleteAttendance } from "../actions";
import { toast } from "sonner";
import { exportAttendance } from "@/lib/utils/export-attendance";
import { Field } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { format, setDate as setDay, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { StaffSchema } from "@/app/master-staff/schema";
import { RoleSchema } from "@/app/master-roles/schema";
import { useRouter, useSearchParams } from "next/navigation";

export default function AttendanceClient({
  initialAttendance,
  staffList,
  roles,
  defaultRange,
}: {
  initialAttendance: AttendanceSchema[];
  staffList: StaffSchema[];
  roles: RoleSchema[];
  defaultRange: { from: Date; to: Date };
}) {
  const [isMounted, setIsMounted] = useState(false);

  // --- UI States ---
  const [formOpen, setFormOpen] = useState(false);
  const [isAlertDeleteOpen, setIsAlertDeleteOpen] = useState(false);

  // --- Data States ---
  const [selected, setSelected] = useState<AttendanceFormData | null>(null);
  const [selectedAttendance, setSelectedAttendance] =
    useState<GroupedAttendance | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- Memos & Helpers ---
  const staffMap = useMemo(
    () => new Map(staffList.map((s) => [s.id, s])),
    [staffList],
  );

  const router = useRouter();
  const searchParams = useSearchParams();

  // range picker
  const [date, setDate] = useState<DateRange | undefined>({
    from: defaultRange.from,
    to: defaultRange.to,
  });

  // Handler saat user memilih tanggal di Calendar
  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);

    if (newDate?.from) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("from", format(newDate.from, "yyyy-MM-dd"));

      if (newDate.to) {
        params.set("to", format(newDate.to, "yyyy-MM-dd"));
      } else {
        params.delete("to");
      }

      // Update URL tanpa reload halaman penuh (Server component otomatis re-fetch)
      router.push(`?${params.toString()}`);
    }
  };

  // filter date data
  const filteredAttendanceByDate = useMemo(() => {
    if (!date?.from) return initialAttendance;

    const fromTime = new Date(date.from).setHours(0, 0, 0, 0);
    const toTime = new Date(date.to || date.from).setHours(23, 59, 59, 999);

    return initialAttendance.filter((item) => {
      const itemTime = new Date(item.date).getTime();
      return itemTime >= fromTime && itemTime <= toTime;
    });
  }, [initialAttendance, date]);

  // grouped data by filter
  const groupedAttendance = useMemo(() => {
    const groups: Record<string, GroupedAttendance> = {};

    filteredAttendanceByDate.forEach((item) => {
      // Kombinasi Tanggal dan Shift sebagai pengenal unik kelompok
      const groupKey = `${item.date}-${item.shift}`;

      // Jalur Logika 1: Jika kelompok belum ada di wadah, buat rumah barunya
      if (!groups[groupKey])
        groups[groupKey] = { id: groupKey, date: item.date, shift: item.shift };

      // Jalur Logika 2: Ambil informasi staff dari map
      const staffInfo = staffMap.get(item.staff_id);
      const roleName = staffInfo?.roles?.role_name;

      // Jalur Logika 3: Jika staff punya role, masukkan ke dalam kelompok
      if (staffInfo && roleName) {
        // Masukkan nama staff ke kolom rolenya (Misal: Apoteker = "Andi")
        groups[groupKey][roleName] = staffInfo.staff_name;
        // Masukkan ID staff untuk kebutuhan interaksi UI (Misal: id_Apoteker = 5)
        groups[groupKey][`id_${roleName}`] = item.staff_id;
      }
    });

    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredAttendanceByDate, staffMap]);

  const HEADER: TableColumn<GroupedAttendance>[] = [
    {
      header: "Date",
      accessor: (d) => formatDateIndo(d.date),
    },
    {
      header: "Shift",
      accessor: (d) => d.shift,
    },
    ...roles.map((role) => ({
      header: role.role_name,
      accessor: (d: GroupedAttendance) => d[role.role_name] || "-",
    })),
  ];

  const handleOpenAdd = () => {
    setSelected(null);
    setFormOpen(true);
  };

  const handleEdit = (row: GroupedAttendance) => {
    const staffIds = roles.map((role) => row[`id_${role.role_name}`] || "");

    const formData = {
      date: row.date,
      shift: row.shift,
      staff_id: staffIds,
    };
    setSelected(formData as any);
    setFormOpen(true);
  };

  const handleDeleteTrigger = (att: GroupedAttendance) => {
    setSelectedAttendance(att);
    setIsAlertDeleteOpen(true);
  };

  if (!isMounted) return null;

  return (
    <div className="mx-auto flex w-full flex-col gap-6 p-4 md:p-6 h-[calc(100vh-64px)] overflow-hidden">
      <SectionHeader
        title="Staff Attendance"
        description="Manage daily clinic attendance."
        icon={CalendarIcon}
        actionLabel="Add attendance"
        onAction={handleOpenAdd}
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
                  onSelect={handleDateChange} // <-- Gunakan handler yang baru
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </Field>

          <Button
            onClick={async () => {
              try {
                const rangeLabel =
                  date?.from && date.to
                    ? ` ${format(date.from, "dd_MMM")}_sd_${format(date.to, "dd_MMM_yyy")}`
                    : "Periode";

                await exportAttendance(
                  initialAttendance, // Data ini sudah ter-filter otomatis dari Supabase!
                  staffList,
                  rangeLabel,
                );
                toast.success("File berhasil diunduh!");
              } catch (error) {
                toast.error("Gagal mengekspor data");
                console.error(error);
              }
            }}
            className="shrink-0 shadow-sm cursor-pointer flex items-center"
            variant="outline"
          >
            <Download />
            <div className="hidden md:block"> Export </div>
          </Button>
        </div>
      </div>

      <SectionTable
        data={groupedAttendance}
        header={HEADER}
        onEdit={handleEdit}
        onDelete={handleDeleteTrigger}
        mobileRender={(row: GroupedAttendance) => (
          <div
            key={row.id}
            className="bg-background rounded-xl shadow-sm space-y-3"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <div className="font-bold">{formatDateIndo(row.date)}</div>
              <Badge variant="secondary">{row.shift}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {roles.map(({ role_name }) => (
                <div key={role_name} className="flex flex-col">
                  <span className="text-muted-foreground text-[10px] uppercase">
                    {role_name}
                  </span>
                  <span className="font-medium truncate">
                    {row[role_name] || "-"}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleEdit(row)}
              >
                <Edit3 className="h-4 w-4 mr-2" /> Edit
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  handleDeleteTrigger(row);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Hapus
              </Button>
            </div>
          </div>
        )}
      />

      {/* Form Dialog */}
      <AttendanceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editData={selected}
        staffList={staffList}
        roles={roles.map((r) => r.role_name)}
      />

      {/* Delete Alert */}
      <ConfirmDeleteDialog
        isOpen={isAlertDeleteOpen}
        onOpenChange={setIsAlertDeleteOpen}
        entityName="Attendance"
        target={
          selectedAttendance
            ? {
                id: `${selectedAttendance.date}|${selectedAttendance.shift}`,
                name: `${selectedAttendance.date} Shift ${selectedAttendance.shift}`,
              }
            : null
        }
        onDeleteAction={deleteAttendance}
      />
    </div>
  );
}
