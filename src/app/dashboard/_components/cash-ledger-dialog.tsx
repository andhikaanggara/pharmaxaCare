"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type DefaultValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { DatePicker } from "@/components/date-picker";
import { SearchableSelect } from "@/components/searchable-select";
import { CurrencyInput } from "@/components/input-currency";
import {
  CASH_KINDS,
  CashFormSchema,
  SHIFTS,
  type CashEntryRow,
  type CashFormType,
  type StaffOption,
} from "@/app/visits/schema";
import { rupiah } from "@/app/visits/utils";
import { currentShift } from "@/lib/shift";
import { createCashEntry, deleteCashEntry, updateCashEntry } from "../action";

const getValues = (
  e?: CashEntryRow | null,
  kind?: CashFormType["kind"],
): DefaultValues<CashFormType> => {
  const now = currentShift();
  return {
    kind: CASH_KINDS.find((k) => k === e?.kind) ?? kind ?? "Setor",
    amount: e?.amount,
    note: e?.note ?? "",
    date: e ? parseISO(e.entry_date) : now.date,
    shift: e ? SHIFTS.find((s) => s === e.entry_shift) : now.shift,
    staff_id: e?.staff_id ?? "",
  };
};

export function CashLedgerDialog({
  open,
  onOpenChange,
  entries,
  staff,
  initialKind,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: CashEntryRow[];
  staff: StaffOption[];
  initialKind?: CashFormType["kind"];
}) {
  const [editing, setEditing] = useState<CashEntryRow | null>(null);
  const [deleting, setDeleting] = useState<CashEntryRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CashFormType>({
    resolver: zodResolver(CashFormSchema),
    defaultValues: getValues(),
  });
  const { control, reset } = form;
  const kind = useWatch({ control, name: "kind" });

  useEffect(() => {
    if (open) reset(getValues(editing, initialKind));
  }, [open, editing, initialKind, reset]);

  const handleSubmit = (data: CashFormType) =>
    startTransition(async () => {
      const payload = { ...data, date: format(data.date, "yyyy-MM-dd") };
      const res = editing
        ? await updateCashEntry(editing.id, payload)
        : await createCashEntry(payload);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(
        editing ? "Catatan kas diperbarui" : "Catatan kas tersimpan",
      );
      setEditing(null);
      reset({
        ...getValues(null, data.kind),
        date: data.date,
        shift: data.shift,
        staff_id: data.staff_id,
      });
    });

  const handleDelete = () =>
    startTransition(async () => {
      if (!deleting) return;
      const res = await deleteCashEntry(deleting.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Catatan kas dihapus");
      if (editing?.id === deleting.id) setEditing(null);
      setDeleting(null);
    });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Catat Kas</DialogTitle>
            <DialogDescription>
              Saldo awal, setor, dan pengeluaran kas. Hanya cash yang
              memengaruhi saldo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Controller
                  name="kind"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Jenis</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id={field.name} className="w-full">
                          <SelectValue placeholder="Pilih jenis" />
                        </SelectTrigger>
                        <SelectContent>
                          {CASH_KINDS.map((k) => (
                            <SelectItem key={k} value={k}>
                              {k}
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

                <Controller
                  name="note"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Keterangan{kind === "Keluar" ? "" : " (opsional)"}
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        placeholder={
                          kind === "Keluar" ? "Untuk apa pengeluaran ini" : ""
                        }
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                {editing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(null)}
                  >
                    Batal edit
                  </Button>
                )}
                <Button type="submit" disabled={isPending}>
                  {editing ? "Simpan perubahan" : "Tambah catatan"}
                </Button>
              </div>
            </FieldGroup>
          </form>

          <div className="space-y-2">
            <p className="text-sm font-medium">Catatan terbaru</p>
            {entries.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Belum ada catatan kas.
              </p>
            )}
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(e.entry_date), "d MMM yyyy", {
                        locale: idLocale,
                      })}{" "}
                      · {e.entry_shift}
                    </span>
                    <Badge variant="outline">{e.kind}</Badge>
                  </p>
                  {e.note && <p className="truncate">{e.note}</p>}
                  <p className="text-xs text-muted-foreground">
                    {e.staff?.name ?? "-"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="font-medium">{rupiah.format(e.amount)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Edit catatan"
                    onClick={() => setEditing(e)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive"
                    aria-label="Hapus catatan"
                    onClick={() => setDeleting(e)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !isPending && !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus catatan kas?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `${deleting.kind} ${rupiah.format(deleting.amount)}${deleting.note ? ` (${deleting.note})` : ""}. `
                : ""}
              Saldo semua shift sesudahnya ikut berubah.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(ev) => {
                ev.preventDefault();
                handleDelete();
              }}
            >
              {isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
