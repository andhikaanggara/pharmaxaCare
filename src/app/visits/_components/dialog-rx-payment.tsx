"use client";

import { useEffect, useTransition } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type DefaultValues,
} from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveRxPayment, updateRxItem } from "../action";
import {
  CARE_OPTIONS,
  CONDITIONS,
  PAYMENT_METHODS,
  ROOMS,
  RX_CHOICES,
  RX_TYPES,
  RxItemFormSchema,
  RxPaymentFormSchema,
  SHIFTS,
  VisitPrescriptionRow,
  isRoomCare,
  needsPayment,
  type RxPaymentFormType,
  type RxPaymentPayload,
  type StaffOption,
  type VisitRow,
} from "../schema";
import { CurrencyInput } from "@/components/input-currency";
import { rupiah } from "../utils";

type RxPaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: VisitRow | null;
  staff: StaffOption[];
  rx?: VisitPrescriptionRow | null;
  paymentOnly?: boolean;
};

type PaymentValues = NonNullable<RxPaymentFormType["payment"]>;

const emptyPayment = () => ({}) as PaymentValues;

const getFormValues = (
  visit?: VisitRow | null,
  editRx?: VisitPrescriptionRow | null,
): DefaultValues<RxPaymentFormType> => {
  if (editRx) {
    return {
      care: CARE_OPTIONS.find((c) => c === visit?.care),
      prescription_type: RX_TYPES.find((t) => t === editRx.prescription_type),
      date: parseISO(editRx.prescription_date),
      shift: SHIFTS.find((s) => s === editRx.prescription_shift),
      staff_id: editRx.pharmacist_staff_id ?? "",
    };
  }

  const longStay = isRoomCare(visit?.care);
  const condition = longStay
    ? (CONDITIONS.find((c) => c === visit?.patient_condition) ??
      "Dalam Perawatan")
    : undefined;

  const pay = visit?.visit_payment?.[0];

  const rx = longStay ? undefined : visit?.visit_prescription?.[0];

  const entry = pay
    ? {
        date: pay.payment_date,
        shift: pay.payment_shift,
        staff: pay.cashier_staff_id,
      }
    : rx
      ? {
          date: rx.prescription_date,
          shift: rx.prescription_shift,
          staff: rx.pharmacist_staff_id,
        }
      : null;

  return {
    care: CARE_OPTIONS.find((c) => c === visit?.care),
    room: ROOMS.find((r) => r === visit?.room),
    prescription_type:
      RX_TYPES.find((t) => t === rx?.prescription_type) ?? "Tidak ada",
    patient_condition: condition,
    date: entry ? parseISO(entry.date) : new Date(),
    shift: entry ? SHIFTS.find((s) => s === entry.shift) : undefined,
    staff_id: entry?.staff ?? "",
    payment:
      visit?.care && needsPayment(longStay, condition)
        ? pay
          ? {
              billed_amount: pay.billed_amount,
              paid_amount: pay.amount,
              payment_method: PAYMENT_METHODS.find(
                (m) => m === pay.payment_method,
              ),
            }
          : emptyPayment()
        : undefined,
  };
};

export default function RxPaymentDialog({
  open,
  onOpenChange,
  visit,
  staff,
  rx,
  paymentOnly,
}: RxPaymentDialogProps) {
  const [isPending, startTransition] = useTransition();
  const isRxEdit = !!rx;
  const isPaymentOnly = !!paymentOnly && !rx;

  const form = useForm<RxPaymentFormType>({
    resolver: (values, ctx, opts) =>
      (rx ? zodResolver(RxItemFormSchema) : zodResolver(RxPaymentFormSchema))(
        values as never,
        ctx,
        opts as never,
      ) as never,
    defaultValues: getFormValues(visit, rx),
  });
  const { control, reset } = form;

  const care = useWatch({ control, name: "care" });
  const isLongStay = isRoomCare(care);

  useEffect(() => {
    if (open) reset(getFormValues(visit, rx));
  }, [open, visit, rx, reset]);

  const condition = useWatch({ control, name: "patient_condition" });
  const method = useWatch({ control, name: "payment.payment_method" });
  const billed = useWatch({ control, name: "payment.billed_amount" });
  const paid = useWatch({ control, name: "payment.paid_amount" });

  const showPayment =
    !isRxEdit && !!care && needsPayment(isLongStay, condition);

  const hadPayment = (visit?.visit_payment?.length ?? 0) > 0;
  const hadRx = (visit?.visit_prescription?.length ?? 0) > 0;
  const isEditMode =
    isRxEdit || isPaymentOnly || hadPayment || (!isLongStay && hadRx);

  const handleCare = (value: string) => {
    const next = CARE_OPTIONS.find((c) => c === value);
    if (!next) return;
    const nextLongStay = isRoomCare(next);
    const nextCondition = nextLongStay ? "Dalam Perawatan" : undefined;

    form.setValue("care", next, { shouldValidate: true });
    if (!nextLongStay) form.setValue("room", undefined);
    form.setValue("patient_condition", nextCondition);
    form.setValue(
      "payment",
      needsPayment(nextLongStay, nextCondition)
        ? (form.getValues("payment") ?? emptyPayment())
        : undefined,
    );
  };

  const handleCondition = (value: string) => {
    const next = CONDITIONS.find((c) => c === value);
    if (!next) return;
    form.setValue("patient_condition", next, { shouldValidate: true });

    if (needsPayment(isLongStay, next)) {
      if (!form.getValues("payment")) form.setValue("payment", emptyPayment());
    } else {
      form.setValue("payment", undefined);
    }
  };

  const handleSubmit = (data: RxPaymentFormType) => {
    if (!visit) return;

    startTransition(async () => {
      if (rx) {
        const res = await updateRxItem(rx.id, {
          prescription_type: data.prescription_type as "Regular" | "Racikan",
          date: format(data.date!, "yyyy-MM-dd"),
          shift: data.shift!,
          staff_id: data.staff_id!,
        });
        if ("error" in res) {
          toast.error(res.error);
          return;
        }
        toast.success("Resep diperbarui");
        onOpenChange(false);
        return;
      }

      const payload: RxPaymentPayload = {
        date: data.date ? format(data.date, "yyyy-MM-dd") : undefined,
        shift: data.shift,
        staff_id: data.staff_id,
        prescription_type: isPaymentOnly ? "Tidak ada" : data.prescription_type,
        payment_only: isPaymentOnly || undefined,
        care: data.care,
        room: data.room,
        patient_condition: data.patient_condition,
        payment: data.payment,
      };

      const res = await saveRxPayment(visit.id, payload);

      if ("error" in res) {
        toast.error(res.error);
        return;
      }

      toast.success(
        isPaymentOnly
          ? "Pembayaran diperbarui"
          : res.data?.closed
            ? "Data tersimpan. Pasien dipulangkan."
            : "Resep berhasil disimpan",
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
      title={
        isRxEdit
          ? "Edit Resep"
          : isPaymentOnly
            ? "Edit Pembayaran"
            : "Resep & Pembayaran"
      }
      isPending={isPending}
      formId="form-rx-payment"
      isEditMode={isEditMode}
    >
      <form id="form-rx-payment" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="max-h-[65vh] overflow-y-auto pr-2">
          <FieldGroup>
            {/* Deskripsi */}
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              {[
                visit?.patients?.name,
                visit?.department,
                visit?.guarantor,
                visit?.care,
                visit?.room,
              ]
                .filter(Boolean)
                .join(" | ")}
            </div>

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

              {/* Jenis Resep */}
              {!isPaymentOnly && (
                <Controller
                  name="prescription_type"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Jenis Resep</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue placeholder="Pilih jenis resep" />
                        </SelectTrigger>
                        <SelectContent>
                          {(isRxEdit ? RX_TYPES : RX_CHOICES).map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
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
              )}

              {/* Care : jika sudah di isi oleh form treatment maka sembunyikan field */}
              {!visit?.care && (
                <Controller
                  name="care"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Penanganan</FieldLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={handleCare}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue placeholder="Pilih penanganan" />
                        </SelectTrigger>
                        <SelectContent>
                          {CARE_OPTIONS.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
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
              )}

              {/* Kamar : jika sudah di isi oleh form treatment && care <> rawat inap / home visit maka sembunyikan field */}
              {!isRxEdit && isLongStay && !visit?.room && (
                <Controller
                  name="room"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Kamar</FieldLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue placeholder="Pilih kamar" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROOMS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
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
              )}

              {/* Kondisi Pasien : jika care = rawat inap | home visit maka munculkan field*/}
              {!isRxEdit && isLongStay && (
                <Controller
                  name="patient_condition"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Kondisi Pasien
                      </FieldLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={handleCondition}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue placeholder="Pilih kondisi pasien" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITIONS.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
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
              )}

              {/* Cara Bayar : Jika patient_condition <> dalam perawatan maka sembunyikan field */}
              {showPayment && (
                <Controller
                  name="payment.payment_method"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Cara Bayar</FieldLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(v) => {
                          field.onChange(v);
                          if (v === "Tidak Bayar") {
                            form.setValue("payment.paid_amount", 0, {
                              shouldValidate: true,
                            });
                          }
                        }}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue placeholder="Pilih cara bayar" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((m) => (
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
              )}

              {/* Nominal : Jika patient_condition <> dalam perawatan maka sembunyikan field */}
              {showPayment && (
                <Controller
                  name="payment.billed_amount"
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
              )}

              {/* Terbayar : Jika Jika patient_condition <> dalam perawatan maka sembunyikan field */}
              {showPayment && (
                <Controller
                  name="payment.paid_amount"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Terbayar</FieldLabel>
                      <CurrencyInput
                        id={field.name}
                        disabled={method === "Tidak Bayar"}
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
              )}
            </div>

            {/* informasi pembayaran : Jika patient_condition <> dalam perawatan maka sembunyikan field */}
            {showPayment && (
              <div className="space-y-3 rounded-lg border p-3">
                {typeof billed === "number" && (
                  <p className="text-sm text-muted-foreground">
                    Sisa tagihan:{" "}
                    <span className="font-medium text-foreground">
                      {rupiah.format(Math.max(billed - (paid ?? 0), 0))}
                    </span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Tanggal, shift, dan petugas di atas dicatat juga sebagai data
                  pembayaran dan pulang pasien.
                </p>
              </div>
            )}

            {!isRxEdit && !showPayment && hadPayment && (
              <p className="text-sm text-destructive">
                Data pembayaran yang sudah tersimpan akan dihapus dan pasien
                kembali berstatus dalam perawatan.
              </p>
            )}
          </FieldGroup>
        </div>
      </form>
    </DialogForm>
  );
}
