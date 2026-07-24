"use client";

import { useMemo, useState } from "react";

import { Search, Users } from "lucide-react";

import { Input } from "@/components/ui/input";

import { SectionHeader } from "@/components/section/section-header";
import { ConfirmDeleteDialog } from "@/components/feedback/confirm-delete-dialog";
import { PatientForm } from "@/app/master-patients/_components/patient-form";
import { deletePatient } from "@/app/master-patients/action";

import { formatDateIndo } from "@/lib/utils/format";
import { PatientSchema } from "../schema";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { MobileDataTable } from "@/components/mobile-data-table";

const columns: ColumnDef<PatientSchema>[] = [
  {
    header: "Patient Name",
    accessorKey: "patient_name",
  },
  { header: "MR Number", accessorKey: "mr_number" },
  { header: "Gender", accessorKey: "gender" },
  {
    header: "Birth Date",
    accessorFn: (patient) => formatDateIndo(patient.birth_date),
  },
  { header: "Phone", accessorKey: "phone" },
  { header: "Address", accessorKey: "address" },
];

type PatientsClientProps = {
  initialPatients: PatientSchema[];
};

export default function PatientsClient({
  initialPatients,
}: PatientsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientSchema | null>(
    null,
  );

  // === FILTER ===
  const filteredPatients = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    if (!lowercasedQuery) return initialPatients;
    return initialPatients.filter(
      (patient) =>
        patient.patient_name.toLowerCase().includes(lowercasedQuery) ||
        patient.mr_number.toLowerCase().includes(lowercasedQuery),
    );
  }, [searchQuery, initialPatients]);

  // === HANDLER
  const handleCreate = () => {
    setSelectedPatient(null);
    setIsFormOpen(true);
  };

  const handleEdit = (patient: PatientSchema) => {
    setSelectedPatient(patient);
    setIsFormOpen(true);
  };

  const handleDelete = (patient: PatientSchema) => {
    setSelectedPatient(patient);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="mx-auto flex w-full flex-col gap-6 p-4 md:p-6 h-[calc(100vh-64px)] overflow-hidden">
      <SectionHeader
        title="Master Patients"
        description="Manage your patients"
        icon={Users}
        actionLabel="Create Patient"
        onAction={handleCreate}
      />

      <section className="relative md:w-70">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search . . ."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4"
        />
      </section>

      {/* Mobile View */}
      <div className="grid grid-cols-1 gap-4 md:hidden overflow-auto max-h-full relative">
        {filteredPatients.map((items) => (
          <MobileDataTable
            key={items.id}
            title={items.patient_name}
            action={items.mr_number}
            onEdit={() => handleEdit(items)}
            onDelete={() => handleDelete(items)}
          >
            <div className="grid grid-cols-3 w-full mb-2">
              <p>{items.gender}</p>
              <p>{items.birth_date}</p>
              <p>{items.phone}</p>
            </div>
            <p>{items.address}</p>
          </MobileDataTable>
        ))}
      </div>

      {/* Desktop View */}
      <DataTable
        columns={columns}
        data={filteredPatients}
        onEdit={handleEdit}
        onDelete={handleDelete}
        hideOnMobile
      />

      <PatientForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editData={selectedPatient}
        initialData={initialPatients?.length}
      />

      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityName="Pasien"
        target={
          selectedPatient && selectedPatient.id
            ? {
                id: selectedPatient.id,
                name: selectedPatient.patient_name,
              }
            : null
        }
        onDeleteAction={deletePatient}
      />
    </div>
  );
}
