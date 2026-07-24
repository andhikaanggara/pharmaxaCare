"use client";

import { useEffect, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// ACTION
import { createTreatment, updateTreatment } from "../action";

// TYPE
import { TreatmentSchema, treatmentSchema } from "../schema";

// UI
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DialogForm } from "@/components/dialog-form";

type TreatmentFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData: TreatmentSchema | null;
};

const defaultValues: z.infer<typeof treatmentSchema> = {
  treatment_name: "",
};

export function TreatmentsForm({
  open,
  onOpenChange,
  editData,
}: TreatmentFormProps) {
  const isEditMode = !!editData;

  const [isPending, startTransition] = useTransition();

  const form = useForm<TreatmentSchema>({
    resolver: zodResolver(treatmentSchema),
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
        form.reset(defaultValues);
      }
    }
  }, [editData, open, form]);

  const handleSubmit = (data: TreatmentSchema) => {
    startTransition(async () => {
      try {
        let result;
        if (isEditMode && editData) {
          result = await updateTreatment({ ...data, id: editData.id });
        } else {
          result = await createTreatment(data);
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
      title="Treatment"
      isPending={isPending}
      formId="form-treatment"
      isEditMode={isEditMode}
    >
      <form id="form-treatment" onSubmit={form.handleSubmit(handleSubmit)}>
        <FieldGroup>
          {/* Treatment Name */}
          <Controller
            name="treatment_name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Treatment Name</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                />
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
