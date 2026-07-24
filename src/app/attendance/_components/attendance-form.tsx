"use client";

import { useEffect, useTransition } from "react";
import { format } from "date-fns";

import { createAttendance, updateAttendance } from "../actions";
import { DialogForm } from "@/components/dialog-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IStaff } from "@/type/staff";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { UserCombobox } from "@/components/user-combobox";

// 1. Definisikan Zod Schema Dinamis agar sesuai dengan jumlah peran/roles di klinik
const attendanceFormSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  shift: z.enum(["Pagi", "Sore", "Malam"]),
  // Menampung ID staff secara dinamis berbasis nama peran (Role Name)
  rolesInput: z.record(z.string(), z.string().optional()),
});

type AttendanceFormValues = z.infer<typeof attendanceFormSchema>;

interface AttendanceFormProps {
  isDialogOpsOpen: boolean;
  setIsDialogOpsOpen: (open: boolean) => void;
  editing: ({ date: string; shift: string } & Record<string, string>) | null;
  roles: string[];
  staffList: IStaff[];
}

function getShiftDefault() {
  const h = new Date().getHours();
  if (h >= 7 && h < 14) return "Pagi";
  if (h >= 14 && h < 21) return "Sore";
  return "Malam";
}

export function AttendanceForm({
  isDialogOpsOpen,
  setIsDialogOpsOpen,
  editing,
  roles,
  staffList,
}: AttendanceFormProps) {
  const isEditMode = editing !== null;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const SHIFTS = ["Pagi", "Sore", "Malam"];

  // 2. Inisialisasi React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      shift: getShiftDefault() as "Pagi" | "Sore" | "Malam",
      rolesInput: {},
    },
  });

  const watchedDate = watch("date");
  const watchedShift = watch("shift");
  const watchedRolesInput = watch("rolesInput") || {};

  // 3. Sinkronisasi Data Saat Dialog Buka/Edit Mode
  useEffect(() => {
    if (isDialogOpsOpen) {
      if (isEditMode && editing) {
        // ambil data id staff per role dari object editing
        const initialRolesInput: Record<string, string> = {};
        roles.forEach((role) => {
          if (editing[role]) {
            initialRolesInput[role] = editing[role];
          }
        });
        reset({
          date: editing.date,
          shift: editing.shift as "Pagi" | "Sore" | "Malam",
          rolesInput: initialRolesInput,
        });
      } else {
        reset({
          date: format(new Date(), "yyyy-MM-dd"),
          shift: getShiftDefault() as "Pagi" | "Sore" | "Malam",
          rolesInput: {},
        });
      }
    }
  }, [isDialogOpsOpen, isEditMode, editing, roles, reset]);

  // 4. Proses Submit Form
  const onSubmit = (values: AttendanceFormValues) => {
    // Bangun FormData untuk dikirim ke Server Action bawaan Cursor Anda
    const fd = new FormData();
    fd.append("date", values.date);
    fd.append("shift", values.shift);

    Object.values(values.rolesInput).forEach((staffId) => {
      if (staffId) fd.append("staff_id", staffId);
    });

    startTransition(async () => {
      const res = isEditMode
        ? await updateAttendance(editing.date, editing.shift, fd)
        : await createAttendance(fd);

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Presensi berhasil disimpan");
        setIsDialogOpsOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <DialogForm
      isOpen={isDialogOpsOpen}
      onOpenChange={setIsDialogOpsOpen}
      title={`${isEditMode ? "Edit" : "Tambah"} Presensi`}
      description="Input data petugas sesuai shift."
      isPending={isPending}
      submitLabel="Simpan"
      formId="attendance-form-id"
      contentClassName="max-h-[90vh] overflow-y-auto sm:max-w-lg"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        id="attendance-form-id"
        className="grid gap-4"
      >
        <div className="flex justify-between items-end">
          <div className="flex gap-4">
            <div className="grid gap-2 col-span-2">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={watchedDate}
                onChange={(e) => setValue("date", e.target.value)}
                disabled={isEditMode}
                required
              />
            </div>
            <div className="grid gap-2 col-span-2">
              <Label>Shift</Label>
              <Select
                disabled={isEditMode}
                value={watchedShift}
                onValueChange={(v) =>
                  setValue("shift", v as "Pagi" | "Sore" | "Malam")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* <Button type="button">
            <Plus />
            Tambah Staff
          </Button> */}
        </div>

        {roles.map((role) => {
          const filteredStaff = staffList.filter(
            (s) => s.roles?.role_name === role && s.is_active,
          );
          return (
            <UserCombobox<IStaff, AttendanceFormValues>
              key={role}
              control={control}
              name={`rolesInput.${role}`}
              label={role}
              items={filteredStaff}
              itemValueKey="id"
              itemDisplayKey="staff_name"
            />
          );
        })}
      </form>
    </DialogForm>
  );
}
