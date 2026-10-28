"use client";

import { useEffect, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import { DialogForm } from "@/components/dialog-form";
import { DatePicker } from "@/components/date-picker";
import { SearchableSelect } from "@/components/searchable-select";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { savePatientRegistration } from "../action";
import {
  PatientRegistrationSchema,
  type PatientRegistrationType,
  type StaffOption,
  type VisitRow,
} from "../schema";

type PatientRegistrationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: VisitRow | null;
  staff: StaffOption[];
};

const GENDERS = ["Laki-laki", "Perempuan"] as const;

const getFormValues = (
  visit?: VisitRow | null,
): Partial<PatientRegistrationType> => {
  const p = visit?.patients;
  return {
    name: p?.name ?? "",
    gender: GENDERS.find((g) => g === p?.gender),
    birth_date: p?.birth_date ? parseISO(p.birth_date) : undefined,
    phone: p?.phone ?? "",
    patient_group: p?.patient_group ?? "",
    address: p?.address ?? "",
    patient_type: p ? (p.is_new ? "Baru" : "Lama") : undefined,
    registration_staff_id: visit?.registration_staff_id ?? "",
  };
};

export default function PatientRegistrationDialog({
  open,
  onOpenChange,
  visit,
  staff,
}: PatientRegistrationDialogProps) {
  const isEditMode = !!visit?.registration_staff_id;
  const [isPending, startTransition] = useTransition();

  const form = useForm<PatientRegistrationType>({
    resolver: zodResolver(PatientRegistrationSchema),
    defaultValues: getFormValues(visit),
  });

  // Isi ulang form setiap dialog dibuka
  const { reset } = form;
  useEffect(() => {
    if (open) reset(getFormValues(visit));
  }, [open, visit, reset]);

  const handleSubmit = (data: PatientRegistrationType) => {
    if (!visit) return;

    startTransition(async () => {
      // Tanggal lahir dikirim sebagai "yyyy-MM-dd" yang diformat di browser,
      // supaya tidak bergeser sehari akibat zona waktu server.
      const res = await savePatientRegistration(visit.id, {
        ...data,
        birth_date: format(data.birth_date, "yyyy-MM-dd"),
      });

      if ("error" in res) {
        toast.error(res.error);
        return;
      }

      toast.success(
        isEditMode
          ? "Data pasien berhasil diperbarui"
          : "Data pasien berhasil disimpan",
      );
      onOpenChange(false);
    });
  };

  return (
    <DialogForm
      open={open}
      onOpenChange={(val) => {
        if (isPending) return;
        onOpenChange(val);
      }}
      title={isEditMode ? "Edit Data Pasien" : "Tambah Data Pasien"}
      isPending={isPending}
      formId="form-patient-registration"
      isEditMode={isEditMode}
    >
      <form
        id="form-patient-registration"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FieldGroup>
          {/* Nama pasien */}
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Nama Pasien</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="Nama lengkap"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Gender */}
            <Controller
              name="gender"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Jenis Kelamin</FieldLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
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

            {/* Tanggal lahir */}
            <Controller
              name="birth_date"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Tanggal Lahir</FieldLabel>
                  <DatePicker
                    id={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={fieldState.invalid}
                    captionLayout="dropdown"
                    startMonth={new Date(1920, 0)}
                    endMonth={new Date()}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* No HP */}
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>No. HP</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="tel"
                    inputMode="tel"
                    placeholder="08xxxxxxxxxx"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Kelompok */}
            <Controller
              name="patient_group"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Kelompok</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="Kelompok pasien"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          {/* Alamat */}
          <Controller
            name="address"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Alamat</FieldLabel>
                <Textarea
                  {...field}
                  id={field.name}
                  rows={3}
                  placeholder="Alamat lengkap"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Jenis pasien */}
            <Controller
              name="patient_type"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Jenis Pasien</FieldLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue placeholder="Pilih jenis pasien" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baru">Baru</SelectItem>
                      <SelectItem value="Lama">Lama</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Petugas pendaftaran */}
            <Controller
              name="registration_staff_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Petugas Pendaftaran
                  </FieldLabel>
                  <SearchableSelect
                    id={field.name}
                    items={staff}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    invalid={fieldState.invalid}
                    getItemValue={(s) => s.id}
                    getItemLabel={(s) => s.name}
                    placeholder="Cari petugas..."
                    emptyText="Petugas tidak ditemukan."
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </form>
    </DialogForm>
  );
}
