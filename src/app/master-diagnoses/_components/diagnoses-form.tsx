"use client";

import { Controller, useForm } from "react-hook-form";
import { useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

// ACTION
import { createDiagnosis, updateDiagnosis } from "../action";

// TYPE
import { DiagnosisSchema, diagnosisSchema } from "../schema";

// UI COMP
import { DialogForm } from "@/components/dialog-form";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

type DiagnosisFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: DiagnosisSchema | null;
  onSuccess?: (created: { id: string; code: string; name: string }) => void;
};

const defaultValues: DiagnosisSchema = {
  code: "",
  name: "",
};

export function DiagnosisForm({
  open,
  onOpenChange,
  editData,
  onSuccess,
}: DiagnosisFormProps) {
  const isEditMode = !!editData;

  const [isPending, startTransition] = useTransition();

  const form = useForm<DiagnosisSchema>({
    resolver: zodResolver(diagnosisSchema),
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

  const handleSubmit = (data: DiagnosisSchema) => {
    startTransition(async () => {
      try {
        let result;
        if (isEditMode && editData) {
          result = await updateDiagnosis({ ...data, id: editData.id });
        } else {
          result = await createDiagnosis(data);
        }

        if (result?.ok) {
          toast.success(
            `Diagnosis ${isEditMode ? "updated" : "created"} successfully`,
          );
          onSuccess?.(result.data);
          onOpenChange(false);
          form.reset(defaultValues);
        } else if (result?.error) {
          toast.error(result.error);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong",
        );
      }
    });
  };

  return (
    <DialogForm
      open={open}
      onOpenChange={(val) => {
        if (isPending) return;
        onOpenChange(val);
      }}
      title="Diagnosis"
      isPending={isPending}
      formId="form-diagnosis"
      isEditMode={isEditMode}
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} id="form-diagnosis">
        <FieldGroup>
          {/* Diagnosis Code */}
          <Controller
            name="code"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Diagnosis Code</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="e.g. A00, J45"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* Diagnosis Name */}
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Diagnosis Name</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="e.g. Cholera, Asthma"
                  aria-invalid={fieldState.invalid}
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
