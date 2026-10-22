"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Search, Stethoscope } from "lucide-react";

// ACTION
import { deleteDiagnosis } from "../action";

// TYPE
import { DiagnosisSchema } from "../schema";

// COMP
import { ConfirmDeleteDialog } from "@/components/feedback/confirm-delete-dialog";
import { SectionHeader } from "@/components/section/section-header";
import { DataTable } from "@/components/data-table";
import { DiagnosisForm } from "./diagnoses-form";
import { Input } from "@/components/ui/input";

const TABLE_COLUMNS: ColumnDef<DiagnosisSchema>[] = [
  {
    header: "Code",
    accessorKey: "code",
    cell: ({ row }) => (
      <span className="font-mono font-medium">{row.original.code}</span>
    ),
  },
  {
    header: "Diagnosis Name",
    accessorKey: "name",
  },
];

interface DiagnosesClientProps {
  initialDiagnoses: DiagnosisSchema[];
}

export default function DiagnosesClient({
  initialDiagnoses,
}: DiagnosesClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedDiagnosis, setSelectedDiagnosis] =
    useState<DiagnosisSchema | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return initialDiagnoses;
    return initialDiagnoses.filter(
      (d) =>
        d.code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q),
    );
  }, [searchQuery, initialDiagnoses]);

  const handleAdd = () => {
    setSelectedDiagnosis(null);
    setIsFormOpen(true);
  };

  const handleEdit = (diagnosis: DiagnosisSchema) => {
    setSelectedDiagnosis(diagnosis);
    setIsFormOpen(true);
  };

  const handleDeleteTrigger = (diagnosis: DiagnosisSchema) => {
    setSelectedDiagnosis(diagnosis);
    setIsDeleteOpen(true);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] w-full flex-col gap-6 overflow-hidden p-4 md:p-6">
      <SectionHeader
        title="Diagnoses Management"
        description="Manage the list of medical diagnoses (ICD-10)."
        icon={Stethoscope}
        actionLabel="Add Diagnosis"
        onAction={handleAdd}
      />

      <section className="relative md:w-70">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search codes or names..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4"
        />
      </section>

      <DataTable
        columns={TABLE_COLUMNS}
        data={filtered}
        onEdit={handleEdit}
        onDelete={handleDeleteTrigger}
      />

      <DiagnosisForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editData={selectedDiagnosis}
      />

      <ConfirmDeleteDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        entityName="Diagnosis"
        target={
          selectedDiagnosis && selectedDiagnosis.id
            ? {
                id: selectedDiagnosis.id,
                name: `${selectedDiagnosis.code} - ${selectedDiagnosis.name}`,
              }
            : null
        }
        onDeleteAction={deleteDiagnosis}
      />
    </div>
  );
}
