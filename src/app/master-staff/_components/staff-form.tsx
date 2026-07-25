"use client";

import { useEffect, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createStaff, updateStaff } from "../actions";
import { StaffSchema, staffSchema } from "../schema";
import { RoleSchema } from "@/app/master-roles/schema";

import { RoleForm } from "@/app/master-roles/_components/roles-form";

import { UserCombobox } from "@/components/user-combobox";
import { DialogForm } from "@/components/dialog-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

type StaffFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: StaffSchema | null;
  rolesData: RoleSchema[];
};

const defaultValues: StaffSchema = {
  id: "",
  staff_name: "",
  role_id: "",
  is_active: true,
};

export function StaffForm({
  open,
  onOpenChange,
  editData,
  rolesData,
}: StaffFormProps) {
  const isEditMode = !!editData;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<StaffSchema>({
    resolver: zodResolver(staffSchema),
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

  const handleSubmit = (data: StaffSchema) => {
    startTransition(async () => {
      try {
        const result = isEditMode
          ? await updateStaff({ ...data, id: editData.id })
          : await createStaff(data);
        
          if (result?.ok) {
          onOpenChange(false);
          form.reset(defaultValues);
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : "Something went wrong");
      }
    });
  };

  const comboboxItems = rolesData.map((role) => ({
    id: String(role.id),
    name: String(role.role_name),
  }));

  return (
    <DialogForm
      open={open}
      onOpenChange={(val) => {
        if (isPending) return;
        onOpenChange(val);
      }}
      title="Staff"
      isPending={isPending}
      formId="form-staff"
      isEditMode={isEditMode}
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} id="form-staff">
        <FieldGroup>
          <Controller
            name="staff_name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Staff Name</FieldLabel>
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

          <Controller
            name="role_id"
            control={form.control}
            render={({ field, fieldState }) => {
              return (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Role</FieldLabel>
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

          <Controller
            name="is_active"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} orientation="horizontal">
                <Checkbox
                  id="is_active"
                  name={field.name}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel htmlFor="is_active">Is Active</FieldLabel>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </form>

      <RoleForm open={isFormOpen} onOpenChange={setIsFormOpen} />
    </DialogForm>
  );
}
