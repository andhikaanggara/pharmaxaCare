"use client";

import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash,
  Trash2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import type { VisitRow } from "../schema";
import { TreatmentGroupHandler, type VisitActionType } from "./table-visits";
import { PatientPopoverCard } from "./popover-patient-card";
import { TreatmentPopoverCard } from "./popover-treatment-card";
import {
  PrescriptionHandler,
  PrescriptionPopoverCard,
} from "./popover-prescription-card";

type InpatientTableProps = {
  visits: VisitRow[];
  onAction: (type: VisitActionType, visit: VisitRow) => void;
  onGroupAction?: TreatmentGroupHandler;
  onRxAction?: PrescriptionHandler;
};

const actionLabel = (exists: boolean, text: string) =>
  `${exists ? "Edit" : "Tambah"} ${text}`;

export function InpatientTable({
  visits,
  onAction,
  onGroupAction,
  onRxAction,
}: InpatientTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pasien</TableHead>
          <TableHead>Kamar</TableHead>
          <TableHead>Resep</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visits.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={4}
              className="h-24 text-center text-muted-foreground"
            >
              Tidak ada pasien rawat inap / home visit.
            </TableCell>
          </TableRow>
        )}

        {visits.map((visit) => {
          return (
            <TableRow key={visit.id}>
              {/* Pasien: hover berisi data pasien */}
              <TableCell className="font-medium">
                <PatientPopoverCard
                  visit={visit}
                  onEdit={() => onAction("patient-data", visit)}
                />
              </TableCell>

              {/* Kamar: hover berisi diagnosis, rekam tindakan, dan tombol edit */}
              <TableCell>
                <div className="flex flex-wrap items-center gap-2">
                  <TreatmentPopoverCard
                    visit={visit}
                    onEdit={() => onAction("treatment", visit)}
                    onFollowUp={() => onAction("followup-treatment", visit)}
                    onGroupAction={onGroupAction}
                  >
                    {visit.room ?? "-"}
                  </TreatmentPopoverCard>
                  {visit.care === "Home Visit" && (
                    <Badge variant="outline">Home Visit</Badge>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <div className="flex flex-wrap items-center gap-2">
                  <PrescriptionPopoverCard
                    visit={visit}
                    onOpen={() => onAction("prescription", visit)}
                    onRxAction={onRxAction}
                  />
                </div>
              </TableCell>

              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontalIcon />
                        <span className="sr-only">Buka menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => onAction("payment", visit)}
                      >
                        Resep / pulang
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
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
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
