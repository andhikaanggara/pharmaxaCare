"use client";

import { useEffect, useState, useTransition } from "react";
import { NumericFormat } from "react-number-format";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import * as z from "zod";

// UI Component
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { VisitFormSection } from "./form-section/visit-form-section";
import { TreatmentFormSelection } from "./form-section/treatment-form-section";

// Server action
import {
  createPatient,
  createTreatments,
  createVisits,
  editPatient,
  editVisits,
} from "../actions";
import { DialogForm } from "@/components/dialog-form";
import { FieldGroup } from "@/components/ui/field";
import { UserCombobox } from "@/components/user-combobox";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { formatDateIndo } from "@/lib/utils/format";
import { PatientForm } from "@/app/master-patients/_components/patient-form";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { visitSchema } from "./schema";

type VisitSchema = z.input<typeof visitSchema>;

interface VisitFormDialogProps {
  patientList: [];
  staffList: [];
  treatmentsList: [];
  setIsOpen: (open: boolean) => void;
  isOpen: boolean;
  isEditVisit: VisitSchema | null;
}

const getShiftDefault = () => {
  const h = new Date().getHours();
  if (h >= 7 && h < 14) return "Pagi";
  if (h >= 14 && h < 21) return "Sore";
  return "Malam";
};

const DEFAULT_VALUES: VisitSchema = {
  id: "",
  date: format(new Date(), "yyyy-MM-dd"),
  shift: getShiftDefault(),
  poly_destination: "Umum",
  registation_id: "",
  nurse_id: "",
  doctor_id: "",
  pharmacist_id: "",
  patient_id: "",
  recipe_type: "Biasa",
  total_amount: "",
  payment: 0,
  payment_methode: "Cash",
  create_by: "",
  treatments: [],
};

const filterValidTreatments = (treatments: any[], visitId: string) => {
  if (!treatments) return [];
  return treatments
    .filter(
      (t) =>
        t && t.treatment_name_id !== "" && t.treatment_name_id !== undefined,
    )
    .map((t) => ({ ...t, visit_id: visitId }));
};

// --- Main Component ---
export function VisitFormDialog({
  patientList = [],
  staffList = [],
  treatmentsList = [],
  setIsOpen,
  isOpen,
  isEditVisit,
}: VisitFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [newPatient, setNewPatient] = useState(false);
  const [isEditPatient, setIsEditPatient] = useState(false);

  // --- Initialize React Hook Form ---
  const visitsForm = useForm<VisitSchema>({
    resolver: zodResolver(visitSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { handleSubmit, watch, reset, setValue } = visitsForm;

  useEffect(() => {
    if (isOpen) {
      if (!isEditVisit) {
        setIsEditPatient(false);
        reset();
      } else {
        reset(isEditVisit);
        setValue("patient_id", isEditVisit.patient_id);
        setNewPatient(false);
        setIsEditPatient(false);
        console.log("form state", watch());
      }
    }
  }, [isOpen, isEditVisit]);

  const handleSubmitVisit = async (data: any) => {
    startTransition(async () => {
      try {
        let currentPatientId = data.patient_id;
        let currentVisitsId = data.id;

        // --- create patient ---
        if (!currentPatientId) {
          const patientRes = await createPatient(data.patients);

          // inset patient id to visits
          setValue("patient_id", currentPatientId);
        }
        if (isEditPatient) {
          // --- edit patient ---
          const editPatientRes = await editPatient(data.patients);
        }

        // --- manaje visit payload ---
        const visitPayload = {
          ...data,
          patient_id: currentPatientId,
          total_amount: Number(data.total_amount) || 0,
          payment: Number(data.payment) || 0,
        };

        // --- create visits ---
        if (!isEditVisit) {
          const visitsRes = await createVisits(visitPayload);

          // inset visit id to treatments
          if (currentVisitsId) {
            setValue("id", currentVisitsId);
          }
        } else {
          // --- edit visits ---
          const editVisitsRes = await editVisits(visitPayload);
        }

        // handle treatments
        const finalizedTreatments = filterValidTreatments(
          data.treatments,
          currentVisitsId,
        );

        // --- create treatments ---
        if (finalizedTreatments.length > 0) {
          const treatmentsRes = await createTreatments(finalizedTreatments);
        }

        toast.success(
          isEditVisit ? "Data berhasil diperbarui" : "Data berhasil disimpan",
        );
        setIsOpen(false);
        reset();
        router.refresh();
      } catch (error: any) {
        toast.error(
          error.message || "Terjadi kesalahan sistem saat menyimpan data.",
        );
      }
    });
  };

  const handleAddPatient = () => {
    setNewPatient(true);
  };

  return (
    <DialogForm
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      title="Create Visits"
      description="Fill in the details below to create a new Visits."
      isPending={isPending}
      submitLabel="Save Visits"
      cancelLabel="Cancel"
      formId="visits-form"
      contentClassName="sm:max-w-md"
    >
      <form>
        <FieldGroup>
          <div className="flex flex-col gap-1">
            <Label>Poli Tujuan</Label>
            <Select
              defaultValue="Umum"
              value={watch("poly_destination") || "Umum"}
              onValueChange={(val) =>
                setValue("poly_destination", val, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Umum">Umum</SelectItem>
                <SelectItem value="Gigi">Gigi</SelectItem>
                <SelectItem value="Bidan">Kebidanan</SelectItem>
                <SelectItem value="Apotek">Apotek</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <UserCombobox
            control={visitsForm.control}
            name="patient_id"
            label="Patient"
            items={patientList}
            itemValueKey="id"
            itemDisplayKey="patient_name"
            showAddButton
            onAddClick={handleAddPatient}
            renderItem={(item: any) => (
              <Item size="xs" className="p-0 cursor-pointer">
                <ItemContent>
                  <ItemTitle>{item.patient_name}</ItemTitle>
                  <ItemDescription>
                    {formatDateIndo(item.birth_date)}
                  </ItemDescription>
                  <ItemDescription className="line-clamp-1">
                    {item.address}
                  </ItemDescription>
                </ItemContent>
              </Item>
            )}
          />
        </FieldGroup>
      </form>

      <FormProvider {...visitsForm}>
        <form
          onSubmit={handleSubmit(handleSubmitVisit)}
          className="flex flex-col gap-4"
        >
          {/* Visits */}
          <VisitFormSection />

          {/* Treatments */}
          <TreatmentFormSelection
            treatmentsList={treatmentsList}
            staffList={staffList}
          />

          <DialogFooter>
            <div className="mr-auto font-bold">
              <NumericFormat
                thousandSeparator="."
                decimalSeparator=","
                prefix="Rp. "
                placeholder="Rp. 0"
                value={watch("total_amount")}
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Menyimpan..."
                : isEditVisit
                  ? "Perbarui Kunjungan"
                  : "Simpan Kunjungan"}
            </Button>
          </DialogFooter>
        </form>
      </FormProvider>

      <PatientForm
        data={patientList}
        isOpen={newPatient}
        onOpenChange={setNewPatient}
      />
    </DialogForm>
  );
}
