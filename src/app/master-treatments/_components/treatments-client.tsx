"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";

// == TYPE ==
import { TreatmentSchema } from "../schema";

// == ui
import { ConfirmDeleteDialog } from "@/components/feedback/confirm-delete-dialog";
import { deleteTreatment } from "../action";
import { TreatmentsForm } from "./treatments-form";
import { Search, Users } from "lucide-react";
import { SectionHeader } from "@/components/section/section-header";
import { DataTable } from "@/components/data-table";
import { Input } from "@/components/ui/input";

const columns: ColumnDef<TreatmentSchema>[] = [
  {
    accessorKey: "treatment_name",
    header: "Treatment Name",
  },
];

type TreatmentsClientProps = {
  initialData: TreatmentSchema[];
};

export default function TreatmentsClient({
  initialData,
}: TreatmentsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedTreatment, setSelectedTreatment] =
    useState<TreatmentSchema | null>(null);

  // === FILTER ===
  const filteredTreatments = useMemo(() => {
    const lowercasedQuery = searchQuery.trim().toLocaleLowerCase();
    if (!lowercasedQuery) return initialData;
    return initialData.filter((r) =>
      r.treatment_name.toLocaleLowerCase().includes(lowercasedQuery),
    );
  }, [searchQuery, initialData]);

  // === HANDLER ===
  const handleCreate = () => {
    setSelectedTreatment(null);
    setFormOpen(true);
  };

  const handleEdit = (data: TreatmentSchema) => {
    setSelectedTreatment(data);
    setFormOpen(true);
  };

  const handleDelete = (data: TreatmentSchema) => {
    setSelectedTreatment(data);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="mx-auto w-full flex flex-col gap-4 overflow-hidden p-4 md:p-6 h-[calc(100vh-64px)]">
      <SectionHeader
        title="Treatments Management"
        description="Manage the list of clinic treatment."
        icon={Users}
        actionLabel="Add Treatment"
        onAction={handleCreate}
      />

      <section className="relative md:w-70">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search roles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4"
        />
      </section>

      <DataTable
        columns={columns}
        data={filteredTreatments}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TreatmentsForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editData={selectedTreatment}
      />

      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityName="Treatment"
        target={
          selectedTreatment && selectedTreatment.id
            ? {
                id: selectedTreatment.id,
                name: selectedTreatment.treatment_name,
              }
            : null
        }
        onDeleteAction={deleteTreatment}
      />
    </div>
  );
}
