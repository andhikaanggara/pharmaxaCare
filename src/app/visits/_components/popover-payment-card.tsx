import { useState } from "react";
import { isRoomCare, VisitRow } from "../schema";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { rupiah } from "../utils";

export function PaymentPopoverCard({
  visit,
  onOpen,
  onEdit,
}: {
  visit: VisitRow;
  onOpen: () => void;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const pay = visit.visit_payment?.[0];

  if (!pay) {
    const inCare = isRoomCare(visit.care);
    return (
      <button
        type="button"
        onClick={onOpen}
        title={
          inCare
            ? "Klik untuk memulangkan pasien"
            : "Klik untuk mengisi pembayaran"
        }
        className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {inCare ? "Dalam perawatan" : <>Belum diisi</>}
      </button>
    );
  }

  const remaining = Math.max(pay.billed_amount - pay.amount, 0);
  const rows: [string, string][] = [
    ["Nominal", rupiah.format(pay.billed_amount)],
    ["Terbayar", rupiah.format(pay.amount)],
    ["Sisa", rupiah.format(remaining)],
    ["Cara bayar", pay.payment_method],
    [
      "Tanggal",
      `${format(parseISO(pay.payment_date), "d MMM yyyy", { locale: idLocale })} · ${pay.payment_shift}`,
    ],
    ["Kasir", pay.cashier?.name ?? "-"],
    ...(visit.patient_condition
      ? ([["Kondisi", visit.patient_condition]] as [string, string][])
      : []),
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline"
        >
          {rupiah.format(pay.amount)}
          {remaining > 0 && <Badge variant="outline">Kurang</Badge>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-3">
        <p className="font-semibold">Pembayaran</p>
        <dl className="grid grid-cols-[6rem_1fr] gap-x-2 gap-y-1 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => {
            setOpen(false);
            onOpen();
          }}
        >
          Edit Pembayaran
        </Button>
      </PopoverContent>
    </Popover>
  );
}
