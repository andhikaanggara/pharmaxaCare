"use client";

import { Controller, useForm } from "react-hook-form";
import { useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

// ACTION
import { createRole, updateRole } from "../action";

// TYPE
import { RoleSchema, roleSchema } from "../schema";

// UI COMP
import { DialogForm } from "@/components/dialog-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

type RoleFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: RoleSchema | null;
};

const defaultValues: RoleSchema = {
  role_name: "",
  is_active: true,
};

export function RoleForm({ open, onOpenChange, editData }: RoleFormProps) {
  const isEditMode = !!editData;

  const [isPending, startTransition] = useTransition();

  const form = useForm<RoleSchema>({
    resolver: zodResolver(roleSchema),
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

  const handleSubmit = (data: RoleSchema) => {
    startTransition(async () => {
      try {
        let result;
        if (isEditMode && editData) {
          result = await updateRole({ ...data, id: editData.id });
        } else {
          result = await createRole(data);
        }

        if (result?.ok) {
          onOpenChange(false);
          form.reset(defaultValues);
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
      }}
      title="Role"
      isPending={isPending}
      formId="form-roles"
      isEditMode={isEditMode}
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} id="form-roles">
        <FieldGroup>
          {/* Role Name */}
          <Controller
            name="role_name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Role Name</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* Status */}
          <Controller
            name="is_active"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="horizontal">
                <Checkbox
                  id="form-roles"
                  name={field.name}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel htmlFor="form-roles">Is Active</FieldLabel>
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
