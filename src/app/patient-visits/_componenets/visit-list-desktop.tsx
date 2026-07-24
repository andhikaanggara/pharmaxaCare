import { TableCell, TableRow } from "@/components/ui/table";
import { VisitTableShell } from "./visit-table-shell";
import { IVisits } from "@/type/visits";
import { formatDateIndo } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Edit3, Trash2 } from "lucide-react";
import { NumericFormat } from "react-number-format";

interface IProps {
  visitsList: IVisits[];
  handleOpenEdit: (row: any) => void;
  setDeleteTarget: (row: any) => void;
  setIsAlertDeleteOpen: (open: boolean) => void;
}

export function VisitListDesktop({
  visitsList,
  handleOpenEdit,
  setDeleteTarget,
  setIsAlertDeleteOpen,
}: IProps) {
  return (
    <div className="hidden md:block overflow-auto h-full relative">
      <VisitTableShell>
        {visitsList.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={8}
              className="text-center text-muted-foreground h-32"
            >
              Belum ada data presensi.
            </TableCell>
          </TableRow>
        ) : (
          visitsList.map((row, i) => (
            <TableRow key={row.id}>
              <TableCell>{i + 1}</TableCell>
              <TableCell>{formatDateIndo(row.date)}</TableCell>
              <TableCell>{row.shift}</TableCell>
              <TableCell>{row.patients.patient_name}</TableCell>
              <TableCell>{row.poly_destination}</TableCell>
              <TableCell>{row.recipe_type}</TableCell>
              <TableCell>{}</TableCell>
              <TableCell>
                <NumericFormat
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="Rp. "
                  placeholder="Rp. 0"
                  value={row.total_amount}
                />
              </TableCell>
              <TableCell>{row.payment_methode}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(row)}
                    className="cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3 text-blue-600" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setDeleteTarget(row);
                      setIsAlertDeleteOpen(true);
                    }}
                    className="cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </VisitTableShell>
    </div>
  );
}
