"use client";

import { useEffect, useTransition } from "react";
import { Controller, useForm, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";

import { DialogForm } from "@/components/dialog-form";
import { DatePicker } from "@/components/date-picker";
import { SearchableSelect } from "@/components/searchable-select";
import { CurrencyInput } from "@/components/input-currency";
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
import { settleReceivable } from "../action";
import {
  SETTLE_METHODS,
  SHIFTS,
  SettlementFormSchema,
  outstanding,
  type SettlementFormType,
  type StaffOption,
  type VisitRow,
} from "../schema";
import { rupiah } from "../utils";
import { currentShift } from "@/lib/shift";

const getValues = (
  visit: VisitRow | null,
): DefaultValues<SettlementFormType> => {
  const now = currentShift();
  return {
    amount: visit ? outstanding(visit) : undefined, // default: lunas penuh, bisa dikurangi untuk cicilan
    date: now.date,
    shift: now.shift,
    staff_id: "",
  };
};

export default function SettlementDialog({
  visit,
  onOpenChange,
  staff,
}: {
  visit: VisitRow | null;
  onOpenChange: (open: boolean) => void;
  staff: StaffOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<SettlementFormType>({
    resolver: zodResolver(SettlementFormSchema),
    defaultValues: getValues(visit),
  });
  const { control, reset } = form;

  useEffect(() => {
    if (visit) reset(getValues(visit));
  }, [visit, reset]);

  const handleSubmit = (data: SettlementFormType) => {
    if (!visit) return;
    if (data.amount > outstanding(visit)) {
      form.setError("amount", { message: "Melebihi sisa tagihan" });
      return;
    }

    startTransition(async () => {
      const res = await settleReceivable(visit.id, {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Pelunasan tersimpan");
      onOpenChange(false);
    });
  };

  return (
    <DialogForm
      open={!!visit}
      onOpenChange={(v) => !isPending && onOpenChange(v)}
      title="Bayar Piutang"
      isPending={isPending}
      formId="form-settlement"
      isEditMode={false}
    >
      <form id="form-settlement" onSubmit={form.handleSubmit(handleSubmit)}>
        <FieldGroup>
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            {visit?.patients?.name ?? "-"} | Sisa tagihan{" "}
            {visit ? rupiah.format(outstanding(visit)) : "-"}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

            <Controller
              name="payment_method"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Cara Bayar</FieldLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue placeholder="Pilih cara bayar" />
                    </SelectTrigger>
                    <SelectContent>
                      {SETTLE_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
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
          </div>
        </FieldGroup>
      </form>
    </DialogForm>
  );
}