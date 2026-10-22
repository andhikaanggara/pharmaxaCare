"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteVisit } from "../action";
import type { VisitRow } from "../schema";

type DeleteVisitDialogProps = {
  visit: VisitRow | null;
  onOpenChange: (open: boolean) => void;
};

export default function DeleteVisitDialog({
  visit,
  onOpenChange,
}: DeleteVisitDialogProps) {
  const [isPending, startTransition] = useTransition();

  const treatmentCount = visit?.visit_treatments?.length ?? 0;
  const prescriptionCount = visit?.visit_prescription?.length ?? 0;
  const paymentCount = visit?.visit_payment?.length ?? 0;

  const handleDelete = () => {
    if (!visit) return;

    startTransition(async () => {
      const res = await deleteVisit(visit.id);

      if ("error" in res) {
        toast.error(res.error);
        return;
      }

      toast.success("Kunjungan berhasil dihapus");
      onOpenChange(false);
    });
  };

  return (
    <AlertDialog
      open={!!visit}
      onOpenChange={(open) => {
        if (isPending) return;
        onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus kunjungan?</AlertDialogTitle>
          <AlertDialogDescription>
            {visit?.patients?.name ?? "Pasien"}
            {visit
              ? ` | ${format(new Date(visit.admission_date), "d MMM yyyy", {
                  locale: idLocale,
                })}`
              : ""}
            . Data berikut akan dihapus permanen dan tidak bisa dikembalikan:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Data kunjungan</li>
          {treatmentCount > 0 && <li>Data tindakan ({treatmentCount})</li>}
          {prescriptionCount > 0 && <li>Data resep ({prescriptionCount})</li>}
          {paymentCount > 0 && (
            <li className="font-medium text-destructive">
              Data pembayaran ({paymentCount})
            </li>
          )}
        </ul>

        <p className="text-xs text-muted-foreground">
          Data pasien tidak ikut dihapus.
        </p>

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
            {isPending ? "Menghapus..." : "Hapus kunjungan"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}