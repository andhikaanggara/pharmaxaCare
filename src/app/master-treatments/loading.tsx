"use client";

import { Search, Users } from "lucide-react";
import { SectionHeader } from "@/components/section/section-header";
import { DataTable } from "@/components/data-table";
import { Input } from "@/components/ui/input";

export default function Loading() {
  return (
    <div className="mx-auto w-full flex flex-col gap-4 overflow-hidden p-4 md:p-6 h-[calc(100vh-64px)]">
      <SectionHeader
        title="Treatments Management"
        description="Manage the list of clinic treatment."
        icon={Users}
        actionLabel="Add Treatment"
      />

      <section className="relative md:w-70">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search roles..."
          className="w-full pl-9 pr-4"
        />
      </section>

      <DataTable columns={[]} data={["loading"]} onEdit={() => []} onDelete={() => []} />
    </div>
  );
}
