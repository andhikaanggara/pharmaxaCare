import { VisitRow } from "../schema";
import { format, parseISO } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { id as idLocale } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PlusIcon } from "lucide-react";

export function PatientPopoverCard({
  visit,
  onEdit,
}: {
  visit: VisitRow;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);

  const p = visit.patients;
  if (!p) return <span className="text-muted-foreground">-</span>;

  if (!visit.registration_staff_id) {
    return (
      <button
        type="button"
        onClick={onEdit}
        title="Klik untuk melengkapi data pasien"
        className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {p.name}
      </button>
    );
  }

  const act = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  const rows: [string, string][] = [
    ["Jenis kelamin", p.gender || "-"],
    [
      "Tanggal lahir",
      p.birth_date
        ? format(parseISO(p.birth_date), "d MMM yyyy", { locale: idLocale })
        : "-",
    ],
    ["No. HP", p.phone || "-"],
    ["Kelompok", p.patient_group || "-"],
    ["Alamat", p.address || "-"],
    ["Petugas", visit.registration_staff?.name ?? "-"],
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="font-medium underline-offset-4 hover:underline"
        >
          {p.name}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{p.name}</p>
          <Badge variant="secondary">{p.is_new ? "Baru" : "Lama"}</Badge>
        </div>
        <dl className="grid grid-cols-[6.5rem_1fr] gap-x-2 gap-y-1 text-sm">
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
          onClick={act(onEdit)}
        >
          Edit data pasien
        </Button>
      </PopoverContent>
    </Popover>
  );
}
