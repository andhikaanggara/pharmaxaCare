"use client";

import { useEffect, useTransition } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  type DefaultValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { DialogForm } from "@/components/dialog-form";
import { DatePicker } from "@/components/date-picker";
import { SearchableSelect } from "@/components/searchable-select";
import { CurrencyInput } from "@/components/input-currency";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOtcSale, updateOtcSale } from "../action";
import {
  OtcSaleFormSchema,
  SHIFTS,
  type OtcSaleFormType,
  type OtcSalePayload,
  type OtcSaleRow,
  type StaffOption,
} from "../schema";

type OtcSaleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: OtcSaleRow | null;
  staff: StaffOption[];
};

const getValues = (
  sale?: OtcSaleRow | null,
): DefaultValues<OtcSaleFormType> => ({
  date: sale ? parseISO(sale.sale_date) : new Date(),
  shift: SHIFTS.find((s) => s === sale?.sale_shift),
  staff_id: sale?.staff_id ?? "",
  amount: sale?.amount,
  drugs: sale ? sale.drug_names.map((name) => ({ name })) : [{ name: "" }],
});

export default function OtcSaleDialog({
  open,
  onOpenChange,
  editData,
  staff,
}: OtcSaleDialogProps) {
  const isEditMode = !!editData;
  const [isPending, startTransition] = useTransition();

  const form = useForm<OtcSaleFormType>({
    resolver: zodResolver(OtcSaleFormSchema),
    defaultValues: getValues(editData),
  });
  const { control, reset } = form;

  useEffect(() => {
    if (open) reset(getValues(editData));
  }, [open, editData, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: "drugs" });

  const handleSubmit = (data: OtcSaleFormType) => {
    startTransition(async () => {
      const payload: OtcSalePayload = {
        date: format(data.date, "yyyy-MM-dd"),
        shift: data.shift,
        staff_id: data.staff_id,
        amount: data.amount,
        drugs: data.drugs,
      };

      const res = editData
        ? await updateOtcSale(editData.id, payload)
        : await createOtcSale(payload);

      if ("error" in res) {
        toast.error(res.error);
        return;
      }

      toast.success(
        isEditMode
          ? "Penjualan berhasil diperbarui"
          : "Penjualan berhasil ditambahkan",
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
      title={isEditMode ? "Edit Penjualan Obat" : "Penjualan Obat"}
      isPending={isPending}
      formId="form-otc-sale"
      isEditMode={isEditMode}
    >
      <form id="form-otc-sale" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="max-h-[65vh] overflow-y-auto pr-2">
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Tanggal */}
              <Controller
                name="date"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Tanggal</FieldLabel>
                    <DatePicker
                      id={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Shift */}
              <Controller
                name="shift"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Shift</FieldLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue placeholder="Pilih shift" />
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

              {/* Petugas */}
              <Controller
                name="staff_id"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Petugas</FieldLabel>
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

              {/* Nominal */}
              <Controller
                name="amount"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Nominal</FieldLabel>
                    <CurrencyInput
                      id={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            {/* Nama obat (satu atau lebih) */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Nama Obat</p>
              {fields.map((f, i) => (
                <Controller
                  key={f.id}
                  name={`drugs.${i}.name`}
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <div className="flex items-start gap-2">
                        <Input
                          {...field}
                          id={field.name}
                          placeholder="Nama obat"
                          aria-invalid={fieldState.invalid}
                          onKeyDown={(e) => {
                            // Enter menambah baris baru, bukan mengirim form
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (field.value.trim()) append({ name: "" });
                            }
                          }}
                        />
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => remove(i)}
                            aria-label="Hapus nama obat"
                          >
                            <XIcon className="size-4" />
                          </Button>
                        )}
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              ))}
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => append({ name: "" })}
              >
                <PlusIcon className="size-4" />
                Tambah obat
              </Button>
            </div>
          </FieldGroup>
        </div>
      </form>
    </DialogForm>
  );
}
