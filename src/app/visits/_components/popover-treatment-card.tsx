import { ReactNode, useState } from "react";
import { groupTreatments, VisitRow } from "../schema";
import { TreatmentGroupHandler } from "./table-visits";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { PencilIcon, Trash2Icon } from "lucide-react";

const SHIFT_ORDER: Record<string, number> = { Pagi: 0, Sore: 1, Malam: 2 };

export function TreatmentPopoverCard({
  visit,
  onEdit,
  onFollowUp,
  onGroupAction,
  children,
}: {
  visit: VisitRow;
  onEdit: () => void;
  onFollowUp?: () => void;
  onGroupAction?: TreatmentGroupHandler;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  if (!visit.care) {
    return (
      <button
        type="button"
        onClick={onEdit}
        title="Klik untuk menambah tindakan"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Belum diisi
      </button>
    );
  }

  const act = (fn?: () => void) => () => {
    setOpen(false);
    fn?.();
  };

  const rows = visit.visit_treatments ?? [];
  const groups = groupTreatments(rows).sort(
    (a, b) =>
      b.first.treatment_date.localeCompare(a.first.treatment_date) ||
      (SHIFT_ORDER[b.first.treatment_shift] ?? 0) -
        (SHIFT_ORDER[a.first.treatment_shift] ?? 0),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-sm underline-offset-4 hover:underline"
        >
          {children ??
            (rows.length > 0 ? `${rows.length} tindakan` : "Tanpa tindakan")}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        collisionPadding={16}
        className="flex w-96 max-h-(--radix-popover-content-available-height) flex-col gap-3"
      >
        <dl className="grid shrink-0 grid-cols-[6rem_1fr] gap-x-2 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Dokter</dt>
          <dd>{visit.doctor?.name ?? "-"}</dd>

          <dt className="text-muted-foreground">Perawat</dt>
          <dd>{visit.nurse?.name ?? "-"}</dd>

          <dt className="text-muted-foreground">Diagnosis</dt>
          <dd className="font-medium">
            {visit.diagnoses
              ? `${visit.diagnoses.code} | ${visit.diagnoses.name}`
              : "-"}
          </dd>

          <dt className="text-muted-foreground">Penanganan</dt>
          <dd>{[visit.care, visit.room].filter(Boolean).join(" | ")}</dd>
        </dl>

        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada tindakan.</p>
        ) : (
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {groups.map(({ key, first, items }) => (
              <div key={key} className="rounded-md border p-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(first.treatment_date), "d MMM yyyy", {
                      locale: idLocale,
                    })}{" "}
                    · {first.treatment_shift}
                  </p>
                  {onGroupAction && (
                    <div className="-mr-1 -mt-1 flex gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        aria-label="Edit tindakan ini"
                        onClick={act(() =>
                          onGroupAction("edit-group", visit, items),
                        )}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 text-destructive"
                        aria-label="Hapus tindakan ini"
                        onClick={act(() =>
                          onGroupAction("delete-group", visit, items),
                        )}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                {first.operator && <p>Operator: {first.operator.name}</p>}
                {first.assistant && <p>Asisten: {first.assistant.name}</p>}
                <ul className="mt-1 list-disc pl-4">
                  {items.map((t) => (
                    <li key={t.id}>{t.treatments?.name ?? "-"}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div
          className={
            onFollowUp
              ? "grid shrink-0 grid-cols-2 gap-2"
              : "grid shrink-0 gap-2"
          }
        >
          {onFollowUp && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={act(onFollowUp)}
            >
              Tambah tindak lanjut
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={act(onEdit)}
          >
            Edit tindakan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
