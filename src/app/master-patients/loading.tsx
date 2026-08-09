"use client";

import { DataTable } from "@/components/data-table";
import { MobileDataTable } from "@/components/mobile-data-table";
import { SectionHeader } from "@/components/section/section-header";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";

export default function Loading() {
  const loadingData: any = ["loading"];
  return (
    <div className="mx-auto flex w-full flex-col gap-6 p-4 md:p-6 h-[calc(100vh-64px)] overflow-hidden">
      <SectionHeader
        title="Master Patients"
        description="Manage your patients"
        icon={Users}
        actionLabel="Create Patient"
      />

      <section className="relative md:w-70">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search . . ." className="w-full pl-9 pr-4" />
      </section>

      {/* === MOBILE VIEW === */}
      <div className="grid grid-cols-1 gap-4 md:hidden overflow-auto max-h-full relative">
        {loadingData.map((items: any) => (
          <MobileDataTable
            key={items.id}
            title={items.patient_name}
            action={items.mr_number}
            onEdit={() => items}
            onDelete={() => items}
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

      {/* === DESKTOP VIEW === */}
      <DataTable
        columns={[]}
        data={loadingData}
        onEdit={() => []}
        onDelete={() => []}
        hideOnMobile
      />
    </div>
  );
}
