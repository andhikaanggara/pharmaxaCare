"use client";

import { useMemo, useState } from "react";

import { Search, Users } from "lucide-react";

// COMP
import { ConfirmDeleteDialog } from "@/components/feedback/confirm-delete-dialog";
import { SectionHeader } from "@/components/section/section-header";
import { StaffForm } from "./staff-form";
import { Input } from "@/components/ui/input";

// TYPE
import { deleteStaff } from "../actions";
import { StaffSchema } from "../schema";
import { RoleSchema } from "@/app/master-roles/schema";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { MobileDataTable } from "@/components/mobile-data-table";

const TABLE_COLUMNS: ColumnDef<StaffSchema>[] = [
  {
    header: "Staff Name",
    accessorKey: "staff_name",
  },
  {
    header: "Role",
    accessorFn: (staff) => staff.roles?.role_name,
  },
  {
    header: "Status",
    accessorFn: (staff) => (staff.is_active ? "Active" : "Non-active"),
  },
];

export default function StaffClient({
  initialStaff,
  initialRoles,
}: {
  initialStaff: StaffSchema[];
  initialRoles: RoleSchema[];
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAllertDeleteOpen, setIsAlertDeleteOpen] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState<StaffSchema | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return initialStaff;

    const lowerCaseQuery = searchQuery.toLowerCase();
    return initialStaff.filter(
      (staff) =>
        staff.staff_name.toLowerCase().includes(lowerCaseQuery) ||
        staff.role_id.toLocaleLowerCase().includes(lowerCaseQuery),
    );
  }, [searchQuery, initialStaff]);

  const handleOpenAdd = () => {
    setSelectedStaff(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (staff: StaffSchema) => {
    setSelectedStaff(staff);
    setIsFormOpen(true);
  };

  const handleDeleteTrigger = (staff: StaffSchema) => {
    setSelectedStaff(staff);
    setIsAlertDeleteOpen(true);
  };

  return (
    <div className="mx-auto flex w-full flex-col gap-6 p-4 md:p-6 h-[calc(100vh-64px)] overflow-hidden">
      {/* Header Section */}
      <SectionHeader
        title="Staff Management"
        description="Manage the list of clinic staff."
        icon={Users}
        actionLabel="Add staff"
        onAction={handleOpenAdd}
      />

      {/* filter */}
      <section className="relative md:w-70">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-4 w-full"
        />
      </section>

      {/* === Mobile Data Table === */}
      <div className="grid grid-cols-1 gap-4 md:hidden overflow-auto max-h-full relative">
        {filteredStaff.map((items) => (
          <MobileDataTable
            key={items.id}
            title={items.staff_name}
            action={items.is_active ? "Active" : "Non-Active"}
            description={items.roles?.role_name}
            onEdit={() => handleOpenEdit(items)}
            onDelete={() => handleDeleteTrigger(items)}
          />
        ))}
      </div>

      {/* === Desktop Data Table === */}
      <DataTable
        data={filteredStaff}
        columns={TABLE_COLUMNS}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteTrigger}
        hideOnMobile
      />

      {/* add/edit Dialog */}
      <StaffForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editData={selectedStaff}
        rolesData={initialRoles}
      />

      {/* Delete Alert */}
      <ConfirmDeleteDialog
        isOpen={isAllertDeleteOpen}
        onOpenChange={setIsAlertDeleteOpen}
        entityName="Staff"
        target={
          selectedStaff && selectedStaff.id
            ? {
                id: selectedStaff.id,
                name: selectedStaff.staff_name,
              }
            : null
        }
        onDeleteAction={deleteStaff}
      />
    </div>
  );
}
