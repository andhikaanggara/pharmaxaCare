"use client";

import { DialogForm } from "@/components/dialog-form";
import { visitsSchema, VisitsSchema } from "../schema";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCombobox } from "@/components/user-combobox";
import { PatientSchema } from "@/app/master-patients/schema";

type VisitsFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: VisitsSchema | null;
  initialPatient: PatientSchema[];
};

const defaultValues: VisitsSchema = {
  id: "",
  date: "",
  shift: "",
  poly: "Umum",
  registation_id: "",
  nurse_id: "",
  doctor_id: "",
  pharmacist_id: "",
  patient_id: "",
  recipe: "Biasa",
  payment: 0,
  payment_methode: "Cash",
};

export function VisitsForm({
  open,
  onOpenChange,
  editData,
  initialPatient,
}: VisitsFormProps) {
  const isEditMode = !!editData;
  const [isPending, startTransition] = useTransition();

  const [isFormOpen, setIsFormOpen] = useState(false);

  const form = useForm<VisitsSchema>({
    resolver: zodResolver(visitsSchema),
    defaultValues: defaultValues,
  });

  const handleSubmit = (data: VisitsSchema) => {
    console.log(data);
    // startTransition(async () => {
    //   try {
    //     let result;
    //     if (isEditMode && editData) {
    //       result = await updateStaff({ ...data, id: editData.id });
    //     } else {
    //       result = await createStaff(data);
    //     }
    //     if (result?.ok) {
    //       onOpenChange(false);
    //       form.reset(defaultValues);
    //     }
    //   } catch (error) {
    //     alert(error instanceof Error ? error.message : "Something went wrong");
    //   }
    // });
  };

  const comboboxItems = initialPatient?.map((patient) => ({
    id: String(patient.id),
    name: String(patient.patient_name),
  }));

  return (
    <DialogForm
      open={open}
      onOpenChange={(val) => {
        if (isPending) return;
        onOpenChange(val);
      }}
      title="Visists"
      isPending={isPending}
      formId="form-visits"
      isEditMode={isEditMode}
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} id="form-visits">
        <FieldGroup>
          {/* === POLY === */}
          <Controller
            name="poly"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Poly</FieldLabel>
                <Select
                  aria-invalid={fieldState.invalid}
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Umum">Umum</SelectItem>
                      <SelectItem value="Gigi">Gigi</SelectItem>
                      <SelectItem value="Apotek">Apotek</SelectItem>
                      <SelectItem value="Lab">Lab</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* === PATIENT NAME === */}
          <Controller
            name="patient_id"
            control={form.control}
            render={({ field, fieldState }) => {
              return (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Patient Name</FieldLabel>
                  <UserCombobox
                    id={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    items={comboboxItems}
                    ariaInvalid={fieldState.invalid}
                    onAddClick={() => setIsFormOpen(true)}
                    showAddButton
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              );
            }}
          />
        </FieldGroup>
      </form>
    </DialogForm>
  );
}
