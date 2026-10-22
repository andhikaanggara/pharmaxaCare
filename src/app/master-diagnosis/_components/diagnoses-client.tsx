"use client";

import { SectionHeader } from "@/components/section/section-header";
import { Users } from "lucide-react";
import { useState } from "react";
import DiagnosesForm from "./diagnoses-form";

export default function DiagnosisClient() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleAdd = () => {
    setIsFormOpen(true);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] w-full flex-col gap-6 overflow-hidden p-4 md:p-6">
      <h1 className="text-2xl font-bold tracking-tight">Master Diagnosis</h1>
      <SectionHeader
        title="Diagnoses Management"
        description="Manage the list of clinic diagnoses."
        icon={Users}
        actionLabel="Add Diagnosis"
        onAction={handleAdd}
      />
      <DiagnosesForm />
    </div>
  );
}
