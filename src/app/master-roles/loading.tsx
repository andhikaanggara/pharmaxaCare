"use client";

import { DataTable } from "@/components/data-table";
import { SectionHeader } from "@/components/section/section-header";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";

export default function Loading() {
  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] w-full flex-col gap-6 overflow-hidden p-4 md:p-6">
      <SectionHeader
        title="Role Management"
        description="Manage the list of clinic roles."
        icon={Users}
        actionLabel="Add Role"
      />

      <section className="relative md:w-70">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search roles..."
          className="w-full pl-9 pr-4"
        />
      </section>

      <DataTable columns={[]} data={[]} onEdit={() => []} onDelete={() => []} />
    </div>
  );
}
