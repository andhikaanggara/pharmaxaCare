"use client";

import { Search, Stethoscope } from "lucide-react";


// COMP
import { SectionHeader } from "@/components/section/section-header";
import { DataTable } from "@/components/data-table";
import { Input } from "@/components/ui/input";

export default function DiagnosesClient() {
  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] w-full flex-col gap-6 overflow-hidden p-4 md:p-6">
      <SectionHeader
        title="Diagnoses Management"
        description="Manage the list of medical diagnoses (ICD-10)."
        icon={Stethoscope}
        actionLabel="Add Diagnosis"
      />

      <section className="relative md:w-70">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search codes or names..."
          className="w-full pl-9 pr-4"
        />
      </section>

      <DataTable columns={[]} data={[]} onEdit={() => []} onDelete={() => []} />

    </div>
  );
}
