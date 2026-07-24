"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatternFormat } from "react-number-format";
import { useEffect, useTransition } from "react";

// ACTION
import { createPatient, updatePatient } from "../action";

// TYPR
import { PatientSchema, patientSchema } from "../schema";

// UI COMP
import { DialogForm } from "@/components/dialog-form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PatientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData: PatientSchema | null;
  initialData: number;
}

const defaultValues: PatientSchema = {
  patient_name: "",
  mr_number: "",
  gender: "",
  birth_date: "",
  phone: "",
  address: "",
};

const generateMRNumber = (existingCount: number): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const seq = (existingCount + 1).toString().padStart(3, "0");
  return `${year}${month}${seq}`;
};

export function PatientForm({
  open,
  onOpenChange,
  editData,
  initialData,
}: PatientFormProps) {
  const isEditMode = !!editData;
  const [isPending, startTransition] = useTransition();

  const form = useForm<PatientSchema>({
    resolver: zodResolver(patientSchema),
    mode: "onChange",
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (open) {
      if (editData) {
        form.reset({
          ...editData,
        });
      } else {
        const newMrNumber = generateMRNumber(initialData);
        form.reset({ ...defaultValues, mr_number: newMrNumber });
      }
    }
  }, [editData, open, form]);

  const handleSubmit = (data: PatientSchema) => {
    startTransition(async () => {
      try {
        let result;
        if (isEditMode && editData) {
          result = await updatePatient({ ...data, id: editData.id });
        } else {
          result = await createPatient(data);
        }

        if (result?.ok) {
          onOpenChange(false);
          form.reset();
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : "Something went wrong");
      }
    });
  };

  return (
    <DialogForm
      open={open}
      onOpenChange={(val) => {
        if (isPending) return;
        onOpenChange(val);
        if (!val) form.reset();
      }}
      title="Patient"
      isPending={isPending}
      formId="form-patient"
      isEditMode={isEditMode}
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} id="form-patient">
        <FieldGroup>
          <Controller
            name="patient_name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Patinent Name</FieldLabel>
                <Input {...field} disabled={isPending} />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="mr_number"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>MR Number</FieldLabel>
                  <Input {...field} readOnly disabled={isPending} />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="gender"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Gender</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Jenis Kelamin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="birth_date"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Birth Date</FieldLabel>
                  <Input {...field} type="date" disabled={isPending} />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Staff Name</FieldLabel>
                  <PatternFormat
                    customInput={Input}
                    mask=""
                    format="#### #### ####"
                    placeholder="08..."
                    value={field.value}
                    onValueChange={(v) => field.onChange(v.value)}
                    disabled={isPending}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <Controller
            name="address"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Address</FieldLabel>
                <Textarea {...field} disabled={isPending} />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </form>
    </DialogForm>
  );
}
