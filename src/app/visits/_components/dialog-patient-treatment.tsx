"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { PlusIcon, Trash2Icon, XIcon } from "lucide-react";
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
// Sesuaikan lokasi kedua modul master ini dengan struktur foldermu
import { DiagnosisForm } from "@/app/master-diagnoses/_components/diagnoses-form";
import { TreatmentsForm } from "@/app/master-treatments/_components/treatments-form";
import { saveVisitTreatments } from "../action";
import {
  CARE_OPTIONS,
  ROOMS,
  SHIFTS,
  TreatmentFormSchema,
  groupTreatments,
  isRoomCare,
  type DiagnosisOption,
  type StaffOption,
  type TreatmentFormType,
  type TreatmentOption,
  type VisitRow,
} from "../schema";

type TreatmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: VisitRow | null;
  diagnoses: DiagnosisOption[];
  treatments: TreatmentOption[];
  staff: StaffOption[];
};

type GroupValues = TreatmentFormType["groups"][number];
type TreatmentFieldPath = `groups.${number}.treatments.${number}.treatment_id`;

const emptyGroup = (visit?: VisitRow | null): GroupValues => ({
  operator_staff_id: "",
  assistant_staff_id: "",
  treatment_date: visit ? new Date(visit.admission_date) : new Date(),
  treatment_shift: SHIFTS.find((s) => s === visit?.admission_shift) ?? "Pagi",
  treatments: [{ treatment_id: "" }],
});

const getFormValues = (
  visit?: VisitRow | null,
): Partial<TreatmentFormType> => ({
  diagnoses_id: visit?.diagnoses_id ?? "",
  care: CARE_OPTIONS.find((c) => c === visit?.care),
  room: ROOMS.find((r) => r === visit?.room),
  doctor_staff_id: visit?.doctor_staff_id ?? "",
  nurse_staff_id: visit?.nurse_staff_id ?? "",
  groups: groupTreatments(visit?.visit_treatments ?? []).map(
    ({ first, items }) => ({
      operator_staff_id: first.operator_staff_id ?? "",
      assistant_staff_id: first.assistant_staff_id ?? "",
      treatment_date: parseISO(first.treatment_date),
      treatment_shift:
        SHIFTS.find((s) => s === first.treatment_shift) ?? "Pagi",
      treatments: items.map((i) => ({ treatment_id: i.treatment_id })),
    }),
  ),
});

// Gabungkan daftar dari server dengan item yang baru dibuat (tanpa duplikat)
function mergeById<T extends { id: string }>(base: T[], extra: T[]): T[] {
  const ids = new Set(base.map((b) => b.id));
  return [...base, ...extra.filter((e) => !ids.has(e.id))];
}

export default function TreatmentDialog({
  open,
  onOpenChange,
  visit,
  diagnoses,
  treatments,
  staff,
}: TreatmentDialogProps) {
  const router = useRouter();
  const isEditMode = !!visit?.care;
  const [isPending, startTransition] = useTransition();

  const form = useForm<TreatmentFormType>({
    resolver: zodResolver(TreatmentFormSchema),
    defaultValues: getFormValues(visit),
  });
  const { control, reset } = form;

  // Isi ulang form setiap dialog dibuka
  useEffect(() => {
    if (open) reset(getFormValues(visit));
  }, [open, visit, reset]);

  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
  } = useFieldArray({ control, name: "groups" });

  const care = useWatch({ control, name: "care" });
  const showRoom = isRoomCare(care);

  // --- Tambah diagnosis / tindakan master dari dalam form ---
  const [diagnosisFormOpen, setDiagnosisFormOpen] = useState(false);
  const [treatmentTarget, setTreatmentTarget] =
    useState<TreatmentFieldPath | null>(null);
  const [addedDiagnoses, setAddedDiagnoses] = useState<DiagnosisOption[]>([]);
  const [addedTreatments, setAddedTreatments] = useState<TreatmentOption[]>([]);

  const diagnosisItems = useMemo(
    () => mergeById(diagnoses, addedDiagnoses),
    [diagnoses, addedDiagnoses],
  );
  const treatmentItems = useMemo(
    () => mergeById(treatments, addedTreatments),
    [treatments, addedTreatments],
  );

  const handleDiagnosisCreated = (created: DiagnosisOption) => {
    setAddedDiagnoses((prev) => [...prev, created]);
    form.setValue("diagnoses_id", created.id, {
      shouldValidate: true,
      shouldDirty: true,
    });
    router.refresh(); // sinkronkan data server di latar belakang
  };

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

  const handleSubmit = (data: TreatmentFormType) => {
    if (!visit) return;

    startTransition(async () => {
      // Tanggal dikirim sebagai "yyyy-MM-dd" yang diformat di browser,
      // supaya tidak bergeser sehari akibat zona waktu server.
      const res = await saveVisitTreatments(visit.id, {
        ...data,
        groups: data.groups.map((g) => ({
          ...g,
          treatment_date: format(g.treatment_date, "yyyy-MM-dd"),
        })),
      });

      if ("error" in res) {
        toast.error(res.error);
        return;
      }

      toast.success(
        isEditMode
          ? "Data tindakan berhasil diperbarui"
          : "Data tindakan berhasil disimpan",
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
        title={isEditMode ? "Edit Tindakan" : "Tambah Tindakan"}
        isPending={isPending}
        formId="form-visit-treatment"
        isEditMode={isEditMode}
      >
        <form
          id="form-visit-treatment"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            <FieldGroup>
              {/* Deskripsi */}
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                {[visit?.patients?.name, visit?.department, visit?.guarantor]
                  .filter(Boolean)
                  .join(" | ")}
              </div>

              {/* Diagnosis */}
              <Controller
                name="diagnoses_id"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Diagnosis</FieldLabel>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <SearchableSelect
                          id={field.name}
                          items={diagnosisItems}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          invalid={fieldState.invalid}
                          getItemValue={(d) => d.id}
                          getItemLabel={(d) => `${d.code} | ${d.name}`}
                          placeholder="Cari kode atau nama diagnosis..."
                          emptyText="Diagnosis tidak ditemukan."
                          renderItem={(d) => (
                            <span className="flex items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">
                                {d.code}
                              </span>
                              <span>{d.name}</span>
                            </span>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => setDiagnosisFormOpen(true)}
                        aria-label="Tambah diagnosis baru"
                        title="Tambah diagnosis baru"
                      >
                        <PlusIcon className="size-4" />
                      </Button>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Penanganan */}
                <Controller
                  name="care"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Penanganan</FieldLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(v) => {
                          field.onChange(v);
                          if (!isRoomCare(v)) form.setValue("room", undefined);
                        }}
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

                {/* Kamar: hanya untuk Rawat Inap / Home Visit */}
                {showRoom && (
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
              </div>

              {/* Penanggung jawab pelayanan: disimpan di tabel visits */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Controller
                  name="doctor_staff_id"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Dokter</FieldLabel>
                      <SearchableSelect
                        id={field.name}
                        items={staff}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        invalid={fieldState.invalid}
                        getItemValue={(s) => s.id}
                        getItemLabel={(s) => s.name}
                        placeholder="Cari dokter..."
                        emptyText="Petugas tidak ditemukan."
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="nurse_staff_id"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Perawat</FieldLabel>
                      <SearchableSelect
                        id={field.name}
                        items={staff}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        invalid={fieldState.invalid}
                        getItemValue={(s) => s.id}
                        getItemLabel={(s) => s.name}
                        placeholder="Cari perawat..."
                        emptyText="Petugas tidak ditemukan."
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Daftar tindakan (boleh kosong) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Tindakan</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendGroup(emptyGroup(visit))}
                  >
                    <PlusIcon className="size-4" />
                    Tambah tindakan
                  </Button>
                </div>

                {groupFields.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Belum ada tindakan. Kosongkan bila pasien tidak mendapat
                    tindakan.
                  </p>
                )}

                {groupFields.map((groupField, index) => (
                  <TreatmentGroupCard
                    key={groupField.id}
                    index={index}
                    control={control}
                    onRemove={() => removeGroup(index)}
                    treatments={treatmentItems}
                    staff={staff}
                    onAddTreatment={setTreatmentTarget}
                  />
                ))}
              </div>
            </FieldGroup>
          </div>
        </form>
      </DialogForm>

      {/* Dialog master: sengaja di luar <form> di atas, supaya submit-nya
          tidak ikut memicu form tindakan lewat event portal React. */}
      <DiagnosisForm
        open={diagnosisFormOpen}
        onOpenChange={setDiagnosisFormOpen}
        editData={null}
        onSuccess={handleDiagnosisCreated}
      />
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

type TreatmentGroupCardProps = {
  index: number;
  control: Control<TreatmentFormType>;
  onRemove: () => void;
  treatments: TreatmentOption[];
  staff: StaffOption[];
  onAddTreatment: (path: TreatmentFieldPath) => void;
};

function TreatmentGroupCard({
  index,
  control,
  onRemove,
  treatments,
  staff,
  onAddTreatment,
}: TreatmentGroupCardProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `groups.${index}.treatments`,
  });

  return (
    <div className="space-y-4 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Tindakan {index + 1}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-destructive"
          onClick={onRemove}
          aria-label={`Hapus tindakan ${index + 1}`}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Operator */}
        <Controller
          name={`groups.${index}.operator_staff_id`}
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Asisten (opsional) */}
        <Controller
          name={`groups.${index}.assistant_staff_id`}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Asisten (opsional)</FieldLabel>
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Tanggal & shift */}
        <Controller
          name={`groups.${index}.treatment_date`}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Tanggal Tindakan</FieldLabel>
              <DatePicker
                id={field.name}
                value={field.value}
                onChange={field.onChange}
                invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name={`groups.${index}.treatment_shift`}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Shift Tindakan</FieldLabel>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      {/* Nama tindakan (satu atau lebih) */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Nama Tindakan</p>
        {fields.map((f, j) => {
          const path = `groups.${index}.treatments.${j}.treatment_id` as const;

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
                        items={treatments}
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
                      onClick={() => onAddTreatment(path)}
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
    </div>
  );
}
