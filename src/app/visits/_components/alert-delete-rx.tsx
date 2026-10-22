// dialog-delete-rx.tsx
"use client";

import { useTransition } from "react";
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
import { deleteRxItem } from "../action";
import type { VisitPrescriptionRow } from "../schema";

export function DeleteRxDialog({
  rx,
  onOpenChange,
}: {
  rx: VisitPrescriptionRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!rx) return;
    startTransition(async () => {
      const res = await deleteRxItem(rx.id);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Resep dihapus");
      onOpenChange(false);
    });
  };

  return (
    <AlertDialog
      open={!!rx}
      onOpenChange={(o) => !isPending && onOpenChange(o)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus resep ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Resep {rx?.prescription_type} pada tanggal {rx?.prescription_date}{" "}
            akan dihapus permanen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault(); // cegah tertutup sebelum proses selesai
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
