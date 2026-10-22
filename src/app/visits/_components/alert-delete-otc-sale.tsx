"use client";

import { useTransition } from "react";
import { format, parseISO } from "date-fns";
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
import { deleteOtcSale } from "../action";
import type { OtcSaleRow } from "../schema";
import { rupiah } from "../utils";

type DeleteOtcSaleDialogProps = {
  sale: OtcSaleRow | null;
  onOpenChange: (open: boolean) => void;
};

export default function DeleteOtcSaleDialog({
  sale,
  onOpenChange,
}: DeleteOtcSaleDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!sale) return;

    startTransition(async () => {
      const res = await deleteOtcSale(sale.id);

      if ("error" in res) {
        toast.error(res.error);
        return;
      }

      toast.success("Penjualan berhasil dihapus");
      onOpenChange(false);
    });
  };

  return (
    <AlertDialog
      open={!!sale}
      onOpenChange={(open) => {
        if (isPending) return;
        onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus penjualan obat?</AlertDialogTitle>
          <AlertDialogDescription>
            {sale
              ? `${format(parseISO(sale.sale_date), "d MMM yyyy", {
                  locale: idLocale,
                })} | ${sale.sale_shift} | ${rupiah.format(sale.amount)}. `
              : ""}
            Data penjualan yang dihapus tidak bisa dikembalikan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {sale && (
          <ul className="list-disc space-y-0.5 pl-5 text-sm">
            {sale.drug_names.map((name, i) => (
              <li key={`${name}-${i}`}>{name}</li>
            ))}
          </ul>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="bg-destructive"
            onClick={(e) => {
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
