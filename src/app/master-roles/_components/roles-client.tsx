"use client";

import { useMemo, useState } from "react";

import { deleteRole } from "../action";
import { ColumnDef } from "@tanstack/react-table";

// TYPE
import { RoleSchema } from "../schema";

// ICON
import { Search, Users } from "lucide-react";

// COMP
import { ConfirmDeleteDialog } from "@/components/feedback/confirm-delete-dialog";
import { SectionHeader } from "@/components/section/section-header";
import { DataTable } from "@/components/data-table";
import { RoleForm } from "./roles-form";
import { Input } from "@/components/ui/input";

const TABLE_COLUMNS: ColumnDef<RoleSchema>[] = [
  {
    header: "Role Name",
    accessorKey: "role_name",
  },
  {
    header: "Status",
    accessorFn: (role) => (role.is_active ? "Active" : "Non-active"),
  },
];

interface RoleClientProps {
  initialRoles: RoleSchema[];
}

export default function RolesClient({ initialRoles }: RoleClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedRole, setSelectedRole] = useState<RoleSchema | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return initialRoles;
    return initialRoles.filter((r) => r.role_name.toLowerCase().includes(q));
  }, [searchQuery, initialRoles]);

  const handleAdd = () => {
    setSelectedRole(null);
    setIsFormOpen(true);
  };

  const handleEdit = (role: RoleSchema) => {
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleDeleteTrigger = (role: RoleSchema) => {
    setSelectedRole(role);
    setIsDeleteOpen(true);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] w-full flex-col gap-6 overflow-hidden p-4 md:p-6">
      <SectionHeader
        title="Role Management"
        description="Manage the list of clinic roles."
        icon={Users}
        actionLabel="Add Role"
        onAction={handleAdd}
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
        columns={TABLE_COLUMNS}
        data={filtered}
        onEdit={handleEdit}
        onDelete={handleDeleteTrigger}
      />

      <RoleForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editData={selectedRole}
      />

      <ConfirmDeleteDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        entityName="Role"
        target={
          selectedRole && selectedRole.id
            ? { id: selectedRole.id, name: selectedRole.role_name }
            : null
        }
        onDeleteAction={deleteRole}
      />
    </div>
  );
}
