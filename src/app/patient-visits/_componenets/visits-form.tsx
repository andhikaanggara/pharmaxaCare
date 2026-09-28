"use client";

import { DialogForm } from "@/components/dialog-form";
import { visitsSchema, VisitsSchema } from "../schema";
import { useEffect, useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type VisitsFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: VisitsSchema | null;
  initialPatient: PatientSchema[];
};

const defaultValues: VisitsSchema = {
  date: "",
  shift: "",
  poly: "Umum",
  pathway: "",
  patient_id: "",
  recipe: "Biasa",
  payment: "",
  payment_methode: "Cash",
  staff_id: [],
  treatments: [],
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

  const { setValue } = form;

  useEffect(() => {
    const currentTime = new Date().getHours();
    const currentDate = new Date().getDay();
    let time = "Night";
    if (currentTime >= 7 && currentTime < 14) {
      time = "Morning";
    } else if (currentTime >= 14 && currentTime < 21) {
      time = "Afternoon";
    }
    setValue("shift", time);
    setValue("date", currentDate.toString());
  }, [setValue]);

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
      title="Visits"
      isPending={isPending}
      formId="form-visits"
      isEditMode={isEditMode}
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} id="form-visits">
        <FieldGroup>
          <div className="grid grid-cols-2 gap-4">
            {/* === VISIT DATE === */}
            <Controller
              name="date"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Visit Date</FieldLabel>
                  <Input type="date" {...field} disabled={isPending} />
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
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Shift</FieldLabel>
                  <Select
                    {...field}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="Morning">Morning</SelectItem>
                        <SelectItem value="Afternoon">Afternoon</SelectItem>
                        <SelectItem value="Night">Night</SelectItem>
                      </SelectGroup>
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
            {/* === POLY === */}
            <Controller
              name="poly"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Department</FieldLabel>
                  <Select
                    {...field}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Dental">Dental</SelectItem>
                        <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                        <SelectItem value="Laboratory">Laboratory</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* === PATHWAY === */}
            <Controller
              name="shift"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Pathway</FieldLabel>
                  <Select
                    {...field}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="OutPatient">Outpatient</SelectItem>
                        <SelectItem value="InPatient">InPatient</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Home Visit">Home Visit</SelectItem>
                        <SelectItem value="Medical Certificate">
                          Medical Certificate
                        </SelectItem>
                        <SelectItem value="Observation">Observation</SelectItem>
                        <SelectItem value="Vitamin Infusion">
                          Vitamin Infusion
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          {/* === PATIENT NAME === */}
          <Controller
            name="patient_id"
            control={form.control}
            render={({ field, fieldState }) => {
              return (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Patient Name</FieldLabel>
                  <Input
                    id={field.name}
                    value={field.value}
                    onChange={field.onChange}
                  />
                  {/* <UserCombobox
                    id={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    items={comboboxItems}
                    ariaInvalid={fieldState.invalid}
                    onAddClick={() => setIsFormOpen(true)}
                    showAddButton
                  /> */}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              );
            }}
          />

          <div className="grid grid-cols-3 gap-4">
            {/* === RECIPE TYPE === */}
            <Controller
              name="recipe"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Recipe Type</FieldLabel>
                    <Select
                      {...field}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="Standard">Standard</SelectItem>
                          <SelectItem value="Compound">Compound</SelectItem>
                          <SelectItem value="None">None</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            />

            {/* === PAYMENT === */}
            <Controller
              name="payment"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Amount</FieldLabel>
                    <Input type="number" {...field} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            />

            {/* === PAYMENT METHODE === */}
            <Controller
              name="payment_methode"
              control={form.control}
              render={({ field, fieldState }) => {
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Method</FieldLabel>
                    <Select
                      {...field}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="BPJS">BPJS</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Transfer">Transfer</SelectItem>
                          <SelectItem value="Qris">Qris</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            />
          </div>

          {/* === TREATMENT === */}
          <Button type="button">Add Treatment</Button>

          {/* === STAFF === */}
          <Button type="button">Edit Staff</Button>
        </FieldGroup>
      </form>
    </DialogForm>
  );
}
