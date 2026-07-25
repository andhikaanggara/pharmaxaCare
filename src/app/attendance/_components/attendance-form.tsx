"use client";

import { useEffect, useState, useTransition } from "react";
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
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { UserCombobox } from "@/components/user-combobox";
import { StaffSchema } from "@/app/master-staff/schema";
import { attendanceSchema, AttendanceSchema } from "../schema";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { StaffForm } from "@/app/master-staff/_components/staff-form";

type AttendanceFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData: ({ date: string; shift: string } & Record<string, string>) | null;
  roles: string[];
  staffList: StaffSchema[];
};

function getShiftDefault() {
  const h = new Date().getHours();
  if (h >= 7 && h < 14) return "Pagi";
  if (h >= 14 && h < 21) return "Sore";
  return "Malam";
}

const SHIFTS = ["Pagi", "Sore", "Malam"];

const defaultValues: AttendanceSchema = {
  date: format(new Date(), "yyyy-MM-dd"),
  shift: getShiftDefault() as "Pagi" | "Sore" | "Malam",
  staff_id: [],
};

export function AttendanceForm({
  open,
  onOpenChange,
  editData,
  roles,
  staffList,
}: AttendanceFormProps) {
  const isEditMode = !!editData;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AttendanceSchema>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (open) {
      if (editData) {
        form.reset({
          date: editData.date,
          shift: editData.shift as "Pagi" | "Sore" | "Malam",
          staff_id: (editData as any).staff_id || [],
        });
      } else {
        form.reset(defaultValues);
      }
    }
  }, [open, isEditMode, roles, form]);

  const handleSubmit = (data: AttendanceSchema) => {
    const fd = new FormData();
    fd.append("date", data.date);
    fd.append("shift", data.shift);

    Object.values(data.staff_id).forEach((staffId) => {
      if (staffId) fd.append("staff_id", staffId);
    });

    startTransition(async () => {
      const result = isEditMode
        ? await updateAttendance(editData.date, editData.shift, fd)
        : await createAttendance(fd);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Presensi berhasil disimpan");
        onOpenChange(false);
      }
    });
  };

  return (
    <DialogForm
      open={open}
      onOpenChange={onOpenChange}
      title="Presensi"
      isPending={isPending}
      formId="form-attendance"
      isEditMode={isEditMode}
    >
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        id="form-attendance"
        className="max-h-[60vh] overflow-y-auto px-1"
      >
        <FieldGroup className="flex flex-col gap-4">
          <div className="flex gap-4 items-end">
            {/* === DATE === */}
            <Controller
              name="date"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="flex flex-col gap-1"
                >
                  <FieldLabel htmlFor={field.name}>Date</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    type="date"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isEditMode || isPending}
                    required
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* === SHIFT === */}
            <Controller
              name="shift"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className="flex flex-col gap-1"
                >
                  <FieldLabel htmlFor={field.name}>Shift</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isEditMode || isPending}
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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            {/* <Button type="button" onClick={() => setIsFormOpen(true)}>
              <Plus />
              Staff
            </Button> */}
          </div>

          {/* === STAFF === */}
          {roles.map((role, index) => {
            const filteredStaff = staffList.filter(
              (s) => s.roles?.role_name === role && s.is_active,
            );
            const comboboxItems = filteredStaff.map((staff) => ({
              id: staff.id,
              name: staff.staff_name,
            }));

            return (
              <Controller
                name="staff_id"
                control={form.control}
                key={role}
                render={({ field, fieldState }) => {
                  return (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="flex flex-col gap-1"
                    >
                      <FieldLabel htmlFor={`${field.name}.${index}`}>
                        {role}
                      </FieldLabel>
                      <div className="flex gap-2">
                        <UserCombobox
                          id={`${field.name}.${index}`}
                          value={field.value?.[index] || ""}
                          onChange={(val) => {
                            const newStaffId = [...(field.value || [])];
                            newStaffId[index] = val || "";
                            field.onChange(newStaffId);
                          }}
                          items={comboboxItems}
                          ariaInvalid={fieldState.invalid}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            const newStaffId = [...(field.value || [])];
                            newStaffId[index] = "";
                            field.onChange(newStaffId);
                          }}
                        >
                          <X />
                        </Button>
                      </div>
                    </Field>
                  );
                }}
              />
            );
          })}
        </FieldGroup>
      </form>

      {/* <StaffForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        rolesData={initialRoles}
      /> */}
    </DialogForm>
  );
}
