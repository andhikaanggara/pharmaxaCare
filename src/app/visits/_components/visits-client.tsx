// app/visits/_components/visit-client.tsx

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
  useRangeNavigation,
  VisitFilterBar,
  VisitFilters,
} from "./filters-visit";
import SettlementDialog from "./settlement-dialog";
import { parseISO } from "date-fns";
import { DialogWaPaient } from "./dialog-wa-patient";

type VisitDialogState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; visit: VisitRow }
  | { type: "delete"; visit: VisitRow };

type RxDialogState =
  | { type: "closed" }
  | { type: "form"; visit: VisitRow }
  | { type: "payment_only"; visit: VisitRow }
  | { type: "edit"; visit: VisitRow; rx: VisitPrescriptionRow }
  | { type: "delete"; rx: VisitPrescriptionRow };

type VisitsClientProps = {
  patients: PatientOption[];
  visits: VisitRow[];
  staff: StaffOption[];
  diagnoses: DiagnosisOption[];
  treatments: TreatmentOption[];
  inpatients: VisitRow[];
  otcSales: OtcSaleRow[];
  range: { from: string; to: string };
};

export default function VisitsClient({
  patients,
  visits,
  staff,
  diagnoses,
  treatments,
  inpatients,
  otcSales,
  range,
}: VisitsClientProps) {
  // State Pencarian
  const [searchQuery, setSearchQuery] = useState("");

  // State Kunjungan

  const [visitDialog, setVisitDialog] = useState<VisitDialogState>({
    type: "closed",
  });

  // State Pendaftaran / data pasien
  const [isPatientForm, setIsPatientForm] = useState(false);
  const [patientVisit, setPatientVisit] = useState<VisitRow | null>(null);

  // State Tindakan
  const [isTreatmentForm, setIsTreatmentForm] = useState(false);
  const [treatmentVisit, setTreatmentVisit] = useState<VisitRow | null>(null);
  const [isFollowUpForm, setIsFollowUpForm] = useState(false);
  const [followUpVisit, setFollowUpVisit] = useState<VisitRow | null>(null);
  const [editGroupRows, setEditGroupRows] = useState<
    VisitTreatmentRow[] | null
  >(null);
  const [deleteTarget, setDeleteTarget] =
    useState<DeleteTreatmentTarget | null>(null);

  const [rxDialog, setRxDialog] = useState<RxDialogState>({ type: "closed" });
  const [settleVisit, setSettleVisit] = useState<VisitRow | null>(null);

  // State Penjualan Apotek
  const [isOtcForm, setIsOtcForm] = useState(false);
  const [editOtc, setEditOtc] = useState<OtcSaleRow | null>(null);
  const [deleteOtc, setDeleteOtc] = useState<OtcSaleRow | null>(null);

  // State navigasi & filter
  const navigate = useRangeNavigation(range);
  const [filters, setFilters] = useState<VisitFilters>(() => ({
    ...getDefaultFilters(),
    range: { from: parseISO(range.from), to: parseISO(range.to) },
  }));

  const [isDialogWaPaient, setIsDialogWaPaient] = useState(false);

  // Buka Form Penjualan
  const openCreateOtc = () => {
    setEditOtc(null);
    setIsOtcForm(true);
  };

  // Filter Kunjungan
  const filteredVisits = useMemo(() => {
    const result = filterVisits(visits, filters);
    const query = searchQuery.trim().toLowerCase();

    if (!query) return result;

    return result.filter((visit) =>
      visit.patients?.name?.toLowerCase().includes(query),
    );
  }, [visits, filters, searchQuery]);

  const phoneNumber: string[] = filteredVisits
    .map((visit) => visit.patients?.phone)
    .filter((phone): phone is string => !!phone);

  // Filter OTC
  const filteredOtcSales = useMemo(
    () => filterOtcSales(otcSales, filters),
    [otcSales, filters],
  );

  const handleAction = (type: VisitActionType, visit: VisitRow) => {
    switch (type) {
      case "edit-visit":
        setVisitDialog({ type: "edit", visit });
        break;
      case "delete-visit":
        setVisitDialog({ type: "delete", visit });
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
      case "payment":
        setRxDialog({ type: "form", visit });
        break;
      case "edit-payment":
        setRxDialog({ type: "payment_only", visit });
        break;
      case "settle-payment":
        setSettleVisit(visit);
        break;
    }
  };

  // handle edit & delete tindakan
  const handleGroupAction: TreatmentGroupHandler = (action, visit, rows) => {
    if (action === "edit-group") {
      setFollowUpVisit(visit);
      setEditGroupRows(rows);
      setIsFollowUpForm(true);
    } else {
      setDeleteTarget({ visit, rows });
    }
  };

  // handle edit & delete Resep
  const handleRxAction: PrescriptionHandler = (action, visit, rx) => {
    if (action === "edit-rx") {
      setRxDialog({ type: "edit", visit, rx });
    } else {
      setRxDialog({ type: "delete", rx });
    }
  };

  return (
    <main className="mx-auto flex h-[calc(100vh-80px)] w-full flex-col gap-4 overflow-hidden p-4 md:p-6">
      <section className="h-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Clipboard />
          Visit Management
        </h1>

        <div className="flex gap-2 w-full md:w-auto">
          <Button
            onClick={() => setVisitDialog({ type: "create" })}
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

      <section className="h-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="relative md:w-70">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search names..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <VisitFilterBar
            value={filters}
            onChange={(f) => {
              setFilters(f);
              navigate(f.range);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDialogWaPaient(true)}
          >
            Salin Wa Pasien
          </Button>
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
              <CardTitle>Rawat Inap</CardTitle>
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
        open={visitDialog.type === "create" || visitDialog.type === "edit"}
        onOpenChange={(open) => {
          if (!open) {
            setVisitDialog({ type: "closed" });
          }
        }}
        patients={patients}
        editData={visitDialog.type === "edit" ? visitDialog.visit : null}
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
        visit={visitDialog.type === "delete" ? visitDialog.visit : null}
        onOpenChange={(open) => {
          if (!open) setVisitDialog({ type: "closed" });
        }}
      />
      <RxPaymentDialog
        open={
          rxDialog.type === "form" ||
          rxDialog.type === "payment_only" ||
          rxDialog.type === "edit"
        }
        onOpenChange={(open) => {
          if (!open) {
            setRxDialog({ type: "closed" });
          }
        }}
        visit={
          rxDialog.type === "form" ||
          rxDialog.type === "payment_only" ||
          rxDialog.type === "edit"
            ? rxDialog.visit
            : null
        }
        staff={staff}
        paymentOnly={rxDialog.type === "payment_only"}
        rx={rxDialog.type === "edit" ? rxDialog.rx : null}
      />

      <DeleteRxDialog
        rx={rxDialog.type === "delete" ? rxDialog.rx : null}
        onOpenChange={(open) => {
          if (!open) setRxDialog({ type: "closed" });
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

      <SettlementDialog
        visit={settleVisit}
        onOpenChange={(o) => {
          if (!o) setSettleVisit(null);
        }}
        staff={staff}
      />

      <DialogWaPaient
        open={isDialogWaPaient}
        onOpenChange={setIsDialogWaPaient}
        text={phoneNumber}
      />
    </main>
  );
}
