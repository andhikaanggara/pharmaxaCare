"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { DialogForm } from "@/components/dialog-form";
import { DatePicker } from "@/components/date-picker";
import { SearchableSelect } from "@/components/searchable-select";
import { Button } from "@/components/ui/button";
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
// Sesuaikan lokasi modul master ini dengan struktur foldermu
import { TreatmentsForm } from "@/app/master-treatments/_components/treatments-form";
import { addVisitTreatments, updateTreatmentGroup } from "../action";
import {
  SHIFTS,
  TreatmentGroupSchema,
  VisitTreatmentRow,
  type FollowUpFormType,
  type StaffOption,
  type TreatmentOption,
  type VisitRow,
} from "../schema";
import { currentShift } from "@/lib/shift";

type FollowUpTreatmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: VisitRow | null;
  treatments: TreatmentOption[];
  staff: StaffOption[];
  editRows?: VisitTreatmentRow[] | null;
};

type TreatmentFieldPath = `treatments.${number}.treatment_id`;

const getDefaults = (
  rows?: VisitTreatmentRow[] | null,
): Partial<FollowUpFormType> => {
  const first = rows?.[0];
  const now = currentShift();
  if (!rows || !first) {
    return {
      operator_staff_id: "",
      assistant_staff_id: "",
      treatment_date: now.date,
      treatment_shift: now.shift,
      treatments: [{ treatment_id: "" }],
    };
  }
  return {
    operator_staff_id: first.operator_staff_id ?? "",
    assistant_staff_id: first.assistant_staff_id ?? "",
    treatment_date: parseISO(first.treatment_date),
    treatment_shift: SHIFTS.find((s) => s === first.treatment_shift),
    treatments: rows.map((r) => ({ treatment_id: r.treatment_id })),
  };
};

function mergeById<T extends { id: string }>(base: T[], extra: T[]): T[] {
  const ids = new Set(base.map((b) => b.id));
  return [...base, ...extra.filter((e) => !ids.has(e.id))];
}

export default function FollowUpTreatmentDialog({
  open,
  onOpenChange,
  visit,
  treatments,
  staff,
  editRows,
}: FollowUpTreatmentDialogProps) {
  const isEditMode = !!editRows?.length;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FollowUpFormType>({
    resolver: zodResolver(TreatmentGroupSchema),
    defaultValues: getDefaults(),
  });
  const { control, reset } = form;

  // Kosongkan form setiap dialog dibuka
  useEffect(() => {
    if (open) reset(getDefaults(editRows));
  }, [open, editRows, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "treatments",
  });

  // --- Tambah tindakan master dari dalam form ---
  const [treatmentTarget, setTreatmentTarget] =
    useState<TreatmentFieldPath | null>(null);
  const [addedTreatments, setAddedTreatments] = useState<TreatmentOption[]>([]);
  const treatmentItems = useMemo(
    () => mergeById(treatments, addedTreatments),
    [treatments, addedTreatments],
  );

  const handleTreatmentCreated = (created: TreatmentOption) => {
    setAddedTreatments((prev) => [...prev, created]);
    if (treatmentTarget) {
      form.setValue(treatmentTarget, created.id, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    router.refresh();
  };

  const handleSubmit = (data: FollowUpFormType) => {
    if (!visit) return;

    startTransition(async () => {
      const payload = {
        ...data,
        treatment_date: format(data.treatment_date, "yyyy-MM-dd"),
      };
      const res = editRows?.length
        ? await updateTreatmentGroup(
            visit.id,
            editRows.map((r) => r.id),
            payload,
          )
        : await addVisitTreatments(visit.id, payload);

      if ("error" in res) {
        toast.error(res.error);
        return;
      }

      toast.success(
        editRows?.length
          ? "Tindakan berhasil diperbarui"
          : "Tindak lanjut berhasil ditambahkan",
      );
      onOpenChange(false);
    });
  };

  return (
    <>
      <DialogForm
        open={open}
        onOpenChange={(val) => {
          if (isPending) return;
          onOpenChange(val);
        }}
        title={isEditMode ? "Edit Tindakan" : "Tindak Lanjut"}
        isPending={isPending}
        formId="form-followup-treatment"
        isEditMode={isEditMode}
      >
        <form
          id="form-followup-treatment"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            <FieldGroup>
              {/* Deskripsi */}
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                {[visit?.patients?.name, visit?.room, visit?.care]
                  .filter(Boolean)
                  .join(" | ")}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Operator */}
                <Controller
                  name="operator_staff_id"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Operator</FieldLabel>
                      <SearchableSelect
                        id={field.name}
                        items={staff}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        invalid={fieldState.invalid}
                        getItemValue={(s) => s.id}
                        getItemLabel={(s) => s.name}
                        placeholder="Cari operator..."
                        emptyText="Petugas tidak ditemukan."
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Asisten (opsional) */}
                <Controller
                  name="assistant_staff_id"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Asisten (opsional)
                      </FieldLabel>
                      <SearchableSelect
                        id={field.name}
                        items={staff}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        invalid={fieldState.invalid}
                        getItemValue={(s) => s.id}
                        getItemLabel={(s) => s.name}
                        placeholder="Cari asisten..."
                        emptyText="Petugas tidak ditemukan."
                        clearable
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Tanggal */}
                <Controller
                  name="treatment_date"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Tanggal Tindakan
                      </FieldLabel>
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
                  name="treatment_shift"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        Shift Tindakan
                      </FieldLabel>
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
              </div>

              {/* Nama tindakan (satu atau lebih) */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Nama Tindakan</p>
                {fields.map((f, j) => {
                  const path = `treatments.${j}.treatment_id` as const;

                  return (
                    <Controller
                      key={f.id}
                      name={path}
                      control={control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <div className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <SearchableSelect
                                id={field.name}
                                items={treatmentItems}
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                invalid={fieldState.invalid}
                                getItemValue={(t) => t.id}
                                getItemLabel={(t) => t.name}
                                placeholder="Cari nama tindakan..."
                                emptyText="Tindakan tidak ditemukan."
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="shrink-0"
                              onClick={() => setTreatmentTarget(path)}
                              aria-label="Tambah tindakan baru ke master"
                              title="Tambah tindakan baru ke master"
                            >
                              <PlusIcon className="size-4" />
                            </Button>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0"
                                onClick={() => remove(j)}
                                aria-label="Hapus nama tindakan"
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
                  );
                })}
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() => append({ treatment_id: "" })}
                >
                  <PlusIcon className="size-4" />
                  Tambah nama tindakan
                </Button>
              </div>
            </FieldGroup>
          </div>
        </form>
      </DialogForm>

      {/* Di luar <form> supaya submit-nya tidak ikut memicu form tindak lanjut */}
      <TreatmentsForm
        open={!!treatmentTarget}
        onOpenChange={(val) => {
          if (!val) setTreatmentTarget(null);
        }}
        editData={null}
        onSuccess={handleTreatmentCreated}
      />
    </>
  );
}
