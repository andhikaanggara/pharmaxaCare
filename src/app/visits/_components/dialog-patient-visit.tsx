// app/visits/_components/patient-visit-dialog.tsx

import { DialogForm } from "@/components/dialog-form";
import { useEffect, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  PatientOption,
  VisitFormSchema,
  VisitFormType,
  VisitRow,
} from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/date-picker";
import { SearchableSelect } from "@/components/searchable-select";
import { createVisit, updateVisit } from "../action";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PatientVisitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: VisitRow | null;
  patients: PatientOption[];
};

const getFormValues = (visit?: VisitRow | null): VisitFormType =>
  visit
    ? {
        isNewPatient: false,
        newPatientName: "",
        patientId: visit.patients?.id ?? "",
        admission_date: new Date(visit.admission_date),
        admission_shift:
          visit.admission_shift as VisitFormType["admission_shift"],
        department: visit.department,
        guarantor: visit.guarantor,
      }
    : {
        isNewPatient: false,
        newPatientName: "",
        patientId: "",
        admission_date: new Date(),
        admission_shift: "Pagi",
        department: "",
        guarantor: "",
      };

export default function PatientVisitDialog({
  open,
  onOpenChange,
  editData,
  patients,
}: PatientVisitDialogProps) {
  const isEditMode = !!editData;
  const [isPending, startTransition] = useTransition();

  const form = useForm<VisitFormType>({
    resolver: zodResolver(VisitFormSchema),
    defaultValues: getFormValues(editData),
  });

  const isNewPatient = useWatch({
    control: form.control,
    name: "isNewPatient",
  });

  const togglePatientMode = () => {
    form.setValue("isNewPatient", !isNewPatient);
    form.setValue("patientId", "");
    form.setValue("newPatientName", "");
    form.clearErrors(["patientId", "newPatientName"]);
  };

  const handleCreatePatient = (name: string) => {
    form.setValue("isNewPatient", true);
    form.setValue("patientId", "");
    form.setValue("newPatientName", name);
    form.clearErrors("patientId");
  };

  const { reset } = form;
  useEffect(() => {
    if (open) reset(getFormValues(editData));
  }, [open, editData, reset]);

  const handleSubmit = (data: VisitFormType) => {
    startTransition(async () => {
      const res = editData
        ? await updateVisit(editData.id, data)
        : await createVisit(data);

      if ("error" in res) {
        toast.error(res.error);
        return;
      }

      toast.success(
        editData
          ? "Kunjungan berhasil diperbarui"
          : "Kunjungan berhasil ditambahkan",
      );
      onOpenChange(false);
    });
  };

  const handleInvalid = (errors: unknown) => {
    console.log("Form errors:", errors);
  };

  return (
    <DialogForm
      open={open}
      onOpenChange={(val) => {
        if (isPending) return;
        onOpenChange(val);
      }}
      title="Patient Visit"
      isPending={isPending}
      formId="form-visit"
      isEditMode={isEditMode}
    >
      <form
        id="form-visit"
        onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}
      >
        <FieldGroup>
          {/* Patient ID */}
          {isNewPatient ? (
            <div className="flex flex-col gap-2">
              <Controller
                name="newPatientName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Nama Pasien Baru
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      autoFocus
                      placeholder="Nama lengkap pasien"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              {!isEditMode && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-0 self-start"
                  onClick={togglePatientMode}
                >
                  Pilih dari pasien terdaftar
                </Button>
              )}
            </div>
          ) : (
            <Controller
              name="patientId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Patient Name</FieldLabel>
                  <SearchableSelect
                    id={field.name}
                    items={patients}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    invalid={fieldState.invalid}
                    getItemValue={(p) => p.id}
                    getItemLabel={(p) => p.name}
                    placeholder="Cari atau ketik nama pasien baru..."
                    onCreate={isEditMode ? undefined : handleCreatePatient}
                    createLabel={(name) => name}
                    emptyText="No patients found."
                    renderItem={(p) => (
                      <Item size="xs" className="p-0">
                        <ItemContent>
                          <ItemTitle className="whitespace-nowrap">
                            {p.name}
                          </ItemTitle>
                          <ItemDescription>
                            {[p.gender, p.birth_date, p.address]
                              .filter(Boolean)
                              .join(" | ") || "Data belum lengkap"}
                          </ItemDescription>
                        </ItemContent>
                      </Item>
                    )}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* admission date */}
            <Controller
              name="admission_date"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Tanggal Masuk</FieldLabel>
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

            {/* admission shift */}
            <Controller
              name="admission_shift"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Admission Shift</FieldLabel>
                  <Select
                    {...field}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select admission shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Admission Shifts</SelectLabel>
                        <SelectItem value="Pagi">Pagi</SelectItem>
                        <SelectItem value="Sore">Sore</SelectItem>
                        <SelectItem value="Malam">Malam</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department */}
            <Controller
              name="department"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Department</FieldLabel>
                  <Select
                    {...field}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Departments</SelectLabel>
                        <SelectItem value="Umum">Umum</SelectItem>
                        <SelectItem value="Gigi">Gigi</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Guarantor */}
            <Controller
              name="guarantor"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Guarantor</FieldLabel>
                  <Select
                    {...field}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select guarantor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Guarantors</SelectLabel>
                        <SelectItem value="Mandiri">Mandiri</SelectItem>
                        <SelectItem value="BPJS">BPJS</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
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
