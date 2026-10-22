"use client";

import { useTransition } from "react";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteTreatmentGroup } from "../action";
import type { VisitRow, VisitTreatmentRow } from "../schema";

export type DeleteTreatmentTarget = {
  visit: VisitRow;
  rows: VisitTreatmentRow[];
};

type DeleteTreatmentGroupDialogProps = {
  target: DeleteTreatmentTarget | null;
  onOpenChange: (open: boolean) => void;
};

export default function DeleteTreatmentGroupDialog({
  target,
  onOpenChange,
}: DeleteTreatmentGroupDialogProps) {
  const [isPending, startTransition] = useTransition();
  const first = target?.rows[0];

  const handleDelete = () => {
    if (!target) return;

    startTransition(async () => {
      const res = await deleteTreatmentGroup(
        target.visit.id,
        target.rows.map((r) => r.id),
      );

      if ("error" in res) {
        toast.error(res.error);
        return;
      }

      toast.success("Tindakan berhasil dihapus");
      onOpenChange(false);
    });
  };

  return (
    <AlertDialog
      open={!!target}
      onOpenChange={(open) => {
        if (isPending) return;
        onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus tindakan ini?</AlertDialogTitle>
          <AlertDialogDescription>
            {target?.visit.patients?.name ?? "Pasien"}
            {first
              ? ` | ${format(parseISO(first.treatment_date), "d MMM yyyy", {
                  locale: idLocale,
                })} | ${first.treatment_shift}`
              : ""}
            . Tindakan yang dihapus tidak bisa dikembalikan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="list-disc space-y-0.5 pl-5 text-sm">
          {target?.rows.map((r) => (
            <li key={r.id}>{r.treatments?.name ?? "-"}</li>
          ))}
        </ul>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="bg-destructive"
            onClick={(e) => {
              // jangan tutup otomatis; tutup setelah proses hapus berhasil
              e.preventDefault();
              handleDelete();
            }}
          >
            {isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}