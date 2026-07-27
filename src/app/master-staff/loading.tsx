"use client";

import { DataTable } from "@/components/data-table";
import { MobileDataTable } from "@/components/mobile-data-table";
import { SectionHeader } from "@/components/section/section-header";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";

export default function Loading() {
  const loadingData: any = [];

  return (
    <div className="mx-auto flex w-full flex-col gap-6 p-4 md:p-6 h-[calc(100vh-64px)] overflow-hidden">
      {/* Header Section */}
      <SectionHeader
        title="Staff Management"
        description="Manage the list of clinic staff."
        icon={Users}
        actionLabel="Add staff"
      />

      {/* filter */}
      <section className="relative md:w-70">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="text" className="pl-9 pr-4 w-full" />
      </section>

      {/* === Mobile Data Table === */}
      <div className="grid grid-cols-1 gap-4 md:hidden overflow-auto max-h-full relative">
        {loadingData.map((items: any) => (
          <MobileDataTable
            key={items.id}
            title={items.staff_name}
            action={items.is_active ? "Active" : "Non-Active"}
            description={items.roles?.role_name}
            onEdit={() => items}
            onDelete={() => items}
          />
        ))}
      </div>

      {/* === Desktop Data Table === */}
      <DataTable
        data={[]}
        columns={[]}
        onEdit={() => []}
        onDelete={() => []}
        hideOnMobile
      />
    </div>
  );
}
