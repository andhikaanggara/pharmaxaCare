import { useState } from "react";
import { initialPayment, isRoomCare, outstanding, paidTotal, settlements, VisitRow } from "../schema";
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
  onSettle,
}: {
  visit: VisitRow;
  onOpen: () => void;
  onEdit: () => void;
  onSettle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const pay = initialPayment(visit);

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
        {inCare ? "Dalam perawatan" : "Belum diisi"}
      </button>
    );
  }

  const fmtDate = (d: string, shift: string) =>
    `${format(parseISO(d), "d MMM yyyy", { locale: idLocale })} · ${shift}`;
  const remaining = outstanding(visit);
  const extra = settlements(visit);
  const rows: [string, string][] = [
    ["Nominal", rupiah.format(pay.billed_amount)],
    ["Terbayar", rupiah.format(paidTotal(visit))],
    ["Sisa", rupiah.format(remaining)],
    ["Cara bayar", pay.payment_method],
    ["Tanggal", fmtDate(pay.payment_date, pay.payment_shift)],
    ["Kasir", pay.cashier?.name ?? "-"],
    ...(visit.patient_condition
      ? ([["Kondisi", visit.patient_condition]] as [string, string][])
      : []),
  ];
  const act = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline"
        >
          {rupiah.format(paidTotal(visit))}
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

        {extra.length > 0 && (
          <div className="space-y-1 text-sm">
            <p className="text-xs font-medium text-muted-foreground">
              Pelunasan
            </p>
            {extra.map((s) => (
              <p key={s.id} className="flex justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {fmtDate(s.payment_date, s.payment_shift)} ·{" "}
                  {s.payment_method}
                </span>
                <span>{rupiah.format(s.amount)}</span>
              </p>
            ))}
          </div>
        )}

        <div
          className={remaining > 0 ? "grid grid-cols-2 gap-2" : "grid gap-2"}
        >
          <Button size="sm" variant="outline" onClick={act(onEdit)}>
            Edit Pembayaran
          </Button>
          {remaining > 0 && (
            <Button size="sm" onClick={act(onSettle)}>
              Bayar Piutang
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
