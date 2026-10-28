import { useState } from "react";
import { isRoomCare, VisitPrescriptionRow, VisitRow } from "../schema";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, Trash2Icon } from "lucide-react";

export type PrescriptionAction = "edit-rx" | "delete-rx";
export type PrescriptionHandler = (
  action: PrescriptionAction,
  visit: VisitRow,
  rx: VisitPrescriptionRow,
) => void;

export function PrescriptionPopoverCard({
  visit,
  onOpen,
  onRxAction,
}: {
  visit: VisitRow;
  onOpen?: () => void;
  onRxAction?: PrescriptionHandler;
}) {
  const [open, setOpen] = useState(false);
  const rx = [...(visit.visit_prescription ?? [])].sort((a, b) =>
    b.prescription_date.localeCompare(a.prescription_date),
  );
  const closed = (visit.visit_payment ?? []).length > 0;
  const canManage = !!onRxAction && isRoomCare(visit.care);

  if (rx.length === 0) {
    if (!onOpen) return <span className="text-muted-foreground">-</span>;
    if (closed)
      return <span className="text-sm text-muted-foreground">Tidak ada</span>;
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4"
      >
        -
      </button>
    );
  }

  const label = [...new Set(visit.visit_prescription?.[0]?.prescription_type)];

  const act = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-sm underline-offset-4 hover:underline"
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={16}
        className="flex w-80 max-h-(--radix-popover-content-available-height) flex-col gap-3"
      >
        <p className="font-semibold">Resep</p>
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {rx.map((r) => (
            <div key={r.id} className="rounded-md border p-2 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(r.prescription_date), "d MMM yyyy", {
                    locale: idLocale,
                  })}{" "}
                  · {r.prescription_shift}
                </p>

                <div className="-mr-1 -mt-1 flex gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    aria-label="Edit resep ini"
                    onClick={act(() => onRxAction!("edit-rx", visit, r))}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6 text-destructive"
                    aria-label="Hapus resep ini"
                    onClick={act(() => onRxAction!("delete-rx", visit, r))}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>
              <p>
                {r.prescription_type}
                {r.pharmacist && ` | ${r.pharmacist.name}`}
              </p>
            </div>
          ))}
        </div>
        {canManage && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={onOpen}
          >
            Tambah Resep
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
