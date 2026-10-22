"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Clipboard, PlusCircle, Search, ShoppingBag } from "lucide-react";
import PatientVisitDialog from "./dialog-patient-visit";
import { useMemo, useState } from "react";
import type {
  DiagnosisOption,
  OtcSaleRow,
  PatientOption,
  StaffOption,
  TreatmentOption,
  VisitPrescriptionRow,
  VisitRow,
  VisitTreatmentRow,
} from "../schema";
import {
  TreatmentGroupHandler,
  VisitsTable,
  type VisitActionType,
} from "./table-visits";
import PatientRegistrationDialog from "./dialog-patient-registration";
import TreatmentDialog from "./dialog-patient-treatment";
import { InpatientTable } from "./table-inpatient";
import FollowUpTreatmentDialog from "./dialog-followup-treatment";
import DeleteTreatmentGroupDialog, {
  DeleteTreatmentTarget,
} from "./dialog-delete-treatment-group";
import DeleteVisitDialog from "./alert-delete-visit";
import RxPaymentDialog from "./dialog-rx-payment";
import { PrescriptionHandler } from "./popover-prescription-card";
import { DeleteRxDialog } from "./alert-delete-rx";
import { OtcSalesTable } from "./table-otc-sales";
import OtcSaleDialog from "./dialog-otc-sale";
import DeleteOtcSaleDialog from "./alert-delete-otc-sale";
import {
  filterOtcSales,
  filterVisits,
  getDefaultFilters,
  VisitFilterBar,
  VisitFilters,
} from "./filters-visit";

type VisitsClientProps = {
  patients: PatientOption[];
  visits: VisitRow[];
  staff: StaffOption[];
  diagnoses: DiagnosisOption[];
  treatments: TreatmentOption[];
  inpatients: VisitRow[];
  otcSales: OtcSaleRow[];
};

export default function VisitsClient({
  patients,
  visits,
  staff,
  diagnoses,
  treatments,
  inpatients,
  otcSales,
}: VisitsClientProps) {
  const [isFormVisit, setIsFormVisit] = useState(false);
  const [editVisit, setEditVisit] = useState<VisitRow | null>(null);
  const [isPatientForm, setIsPatientForm] = useState(false);
  const [patientVisit, setPatientVisit] = useState<VisitRow | null>(null);
  const [isTreatmentForm, setIsTreatmentForm] = useState(false);
  const [treatmentVisit, setTreatmentVisit] = useState<VisitRow | null>(null);
  const [isFollowUpForm, setIsFollowUpForm] = useState(false);
  const [followUpVisit, setFollowUpVisit] = useState<VisitRow | null>(null);
  const [editGroupRows, setEditGroupRows] = useState<
    VisitTreatmentRow[] | null
  >(null);
  const [deleteTarget, setDeleteTarget] =
    useState<DeleteTreatmentTarget | null>(null);
  const [rxEdit, setRxEdit] = useState<{
    visit: VisitRow;
    rx: VisitPrescriptionRow;
  } | null>(null);

  const [deleteVisitTarget, setDeleteVisitTarget] = useState<VisitRow | null>(
    null,
  );
  const [filters, setFilters] = useState<VisitFilters>(getDefaultFilters);

  const [rxPaymentOnly, setRxPaymentOnly] = useState(false);

  const [rxDelete, setRxDelete] = useState<VisitPrescriptionRow | null>(null);
  const [isRxForm, setIsRxForm] = useState(false);
  const [rxVisit, setRxVisit] = useState<VisitRow | null>(null);

  const openCreate = () => {
    setEditVisit(null);
    setIsFormVisit(true);
  };

  const [isOtcForm, setIsOtcForm] = useState(false);
  const [editOtc, setEditOtc] = useState<OtcSaleRow | null>(null);
  const [deleteOtc, setDeleteOtc] = useState<OtcSaleRow | null>(null);

  const openCreateOtc = () => {
    setEditOtc(null); // tanpa ini, "Tambah" membuka form edit sisa sebelumnya
    setIsOtcForm(true);
  };

  const filteredVisits = useMemo(
    () => filterVisits(visits, filters),
    [visits, filters],
  );

  const filteredOtcSales = useMemo(
    () => filterOtcSales(otcSales, filters),
    [otcSales, filters],
  );

  const handleAction = (type: VisitActionType, visit: VisitRow) => {
    switch (type) {
      case "edit-visit":
        setEditVisit(visit);
        setIsFormVisit(true);
        break;
      case "delete-visit":
        setDeleteVisitTarget(visit);
        break;
      case "patient-data":
        setPatientVisit(visit);
        setIsPatientForm(true);
        break;
      case "treatment":
        setTreatmentVisit(visit);
        setIsTreatmentForm(true);
        break;
      case "followup-treatment":
        setFollowUpVisit(visit);
        setEditGroupRows(null);
        setIsFollowUpForm(true);
        break;
      case "prescription":
        setRxPaymentOnly(false);
        break;
      case "payment":
        setRxEdit(null);
        setRxVisit(visit);
        setIsRxForm(true);
        break;
      case "edit-payment":
        setRxVisit(visit);
        setRxEdit(null);
        setRxPaymentOnly(true);
        setIsRxForm(true);
        break;
    }
  };

  const handleGroupAction: TreatmentGroupHandler = (action, visit, rows) => {
    if (action === "edit-group") {
      setFollowUpVisit(visit);
      setEditGroupRows(rows);
      setIsFollowUpForm(true);
    } else {
      setDeleteTarget({ visit, rows });
    }
  };

  const handleRxAction: PrescriptionHandler = (action, visit, rx) => {
    if (action === "edit-rx") setRxEdit({ visit, rx });
    else setRxDelete(rx); // konfirmasi hapus, seperti delete-group
  };

  return (
    <main className="mx-auto flex h-[calc(100vh-64px)] w-full flex-col gap-6 overflow-hidden p-4 md:p-6">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Clipboard />
          Visit Management
        </h1>

        <div className="flex gap-2 w-full md:w-auto">
          <Button
            onClick={openCreate}
            variant="default"
            className="flex-1 md:flex-none gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Tambah Kunjungan
          </Button>
          <Button
            onClick={openCreateOtc}
            variant="outline"
            className="flex-1 md:flex-none gap-2"
          >
            <ShoppingBag className="h-4 w-4" />
            Tambah Penjualan
          </Button>
        </div>
      </section>

      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="relative md:w-70">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search codes or names..."
            value={[]}
            onChange={(e) => console.log("Search query:", e.target.value)}
            className="w-full pl-9 pr-4"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <VisitFilterBar value={filters} onChange={setFilters} />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-auto">
        {/* Kunjungan Pasien */}
        <Card className="col-span-2 flex flex-col h-full">
          <CardHeader>
            <CardTitle>Kunjungan Pasien</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <VisitsTable
              visits={filteredVisits}
              onAction={handleAction}
              onGroupAction={handleGroupAction}
              onRxAction={handleRxAction}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          {/* Rawat Inap */}
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Rawat Inap ({inpatients.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <InpatientTable
                visits={inpatients}
                onAction={handleAction}
                onGroupAction={handleGroupAction}
                onRxAction={handleRxAction}
              />
            </CardContent>
          </Card>

          {/* Penjualan Obat */}
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Penjualan Obat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <OtcSalesTable
                sales={filteredOtcSales}
                onEdit={(sale) => {
                  setEditOtc(sale);
                  setIsOtcForm(true);
                }}
                onDelete={setDeleteOtc}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      <PatientVisitDialog
        open={isFormVisit}
        onOpenChange={setIsFormVisit}
        patients={patients}
        editData={editVisit}
      />
      <PatientRegistrationDialog
        open={isPatientForm}
        onOpenChange={setIsPatientForm}
        visit={patientVisit}
        staff={staff}
      />
      <TreatmentDialog
        open={isTreatmentForm}
        onOpenChange={setIsTreatmentForm}
        visit={treatmentVisit}
        diagnoses={diagnoses}
        treatments={treatments}
        staff={staff}
      />
      <FollowUpTreatmentDialog
        open={isFollowUpForm}
        onOpenChange={setIsFollowUpForm}
        visit={followUpVisit}
        editRows={editGroupRows}
        treatments={treatments}
        staff={staff}
      />
      <DeleteTreatmentGroupDialog
        target={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
      <DeleteVisitDialog
        visit={deleteVisitTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteVisitTarget(null);
        }}
      />
      <RxPaymentDialog
        open={isRxForm}
        onOpenChange={setIsRxForm}
        visit={rxVisit}
        staff={staff}
        paymentOnly={rxPaymentOnly}
      />
      <RxPaymentDialog
        open={!!rxEdit}
        onOpenChange={(o) => !o && setRxEdit(null)}
        visit={rxEdit?.visit ?? null}
        rx={rxEdit?.rx ?? null}
        staff={staff}
      />

      <DeleteRxDialog
        rx={rxDelete}
        onOpenChange={(open) => {
          if (!open) setRxDelete(null);
        }}
      />

      <OtcSaleDialog
        open={isOtcForm}
        onOpenChange={setIsOtcForm}
        editData={editOtc}
        staff={staff}
      />
      <DeleteOtcSaleDialog
        sale={deleteOtc}
        onOpenChange={(open) => {
          if (!open) setDeleteOtc(null);
        }}
      />
    </main>
  );
}
