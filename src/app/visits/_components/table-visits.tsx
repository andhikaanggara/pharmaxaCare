"use client";

import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VisitTreatmentRow, type VisitRow } from "../schema";
import { PatientPopoverCard } from "./popover-patient-card";
import { TreatmentPopoverCard } from "./popover-treatment-card";
import {
  PrescriptionHandler,
  PrescriptionPopoverCard,
} from "./popover-prescription-card";
import { PaymentPopoverCard } from "./popover-payment-card";

export type VisitActionType =
  | "patient-data"
  | "treatment"
  | "followup-treatment"
  | "prescription"
  | "payment"
  | "edit-payment"
  | "edit-visit"
  | "delete-visit";

type VisitsTableProps = {
  visits: VisitRow[];
  onAction: (type: VisitActionType, visit: VisitRow) => void;
  onGroupAction?: TreatmentGroupHandler;
  onRxAction?: PrescriptionHandler;
};

export type TreatmentGroupAction = "edit-group" | "delete-group";
export type TreatmentGroupHandler = (
  action: TreatmentGroupAction,
  visit: VisitRow,
  rows: VisitTreatmentRow[],
) => void;

const Empty = () => <span className="text-muted-foreground">-</span>;

export function VisitsTable({
  visits,
  onAction,
  onGroupAction,
  onRxAction,
}: VisitsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pasien</TableHead>
          <TableHead>Departemen</TableHead>
          <TableHead>Guarantor</TableHead>
          <TableHead>Care</TableHead>
          <TableHead>Tindakan</TableHead>
          <TableHead>Resep</TableHead>
          <TableHead>Pembayaran</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visits.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={8}
              className="h-24 text-center text-muted-foreground"
            >
              Belum ada data kunjungan.
            </TableCell>
          </TableRow>
        )}

        {visits.map((visit) => {
          return (
            <TableRow key={visit.id}>
              <TableCell className="font-medium">
                <PatientPopoverCard
                  visit={visit}
                  onEdit={() => onAction("patient-data", visit)}
                />
              </TableCell>
              <TableCell>{visit.department}</TableCell>
              <TableCell>{visit.guarantor}</TableCell>
              <TableCell>{visit.care ?? <Empty />}</TableCell>

              {/* Tindakan: klik untuk melihat daftar */}
              <TableCell>
                <TreatmentPopoverCard
                  visit={visit}
                  onEdit={() => onAction("treatment", visit)}
                  onFollowUp={() => onAction("followup-treatment", visit)}
                  onGroupAction={onGroupAction}
                />
              </TableCell>

              <TableCell>
                <PrescriptionPopoverCard
                  visit={visit}
                  onOpen={() => onAction("prescription", visit)}
                  onRxAction={onRxAction}
                />
              </TableCell>

              <TableCell>
                <PaymentPopoverCard
                  visit={visit}
                  onOpen={() => onAction("payment", visit)}
                  onEdit={() => onAction("edit-payment", visit)}
                />
              </TableCell>

              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontalIcon />
                      <span className="sr-only">Buka menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => onAction("edit-visit", visit)}
                    >
                      <PencilIcon />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => onAction("delete-visit", visit)}
                    >
                      <Trash2Icon />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
