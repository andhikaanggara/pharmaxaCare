"use client";

import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Edit, MoreHorizontalIcon, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OtcSaleRow } from "../schema";
import { rupiah } from "../utils";

type OtcSalesTableProps = {
  sales: OtcSaleRow[];
  onEdit: (sale: OtcSaleRow) => void;
  onDelete: (sale: OtcSaleRow) => void;
};

export function OtcSalesTable({ sales, onEdit, onDelete }: OtcSalesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama Obat</TableHead>
          <TableHead className="text-right">Nominal</TableHead>
          <TableHead className="w-10 text-right">
            <span className="sr-only">Aksi</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={3}
              className="h-24 text-center text-muted-foreground"
            >
              Belum ada penjualan obat.
            </TableCell>
          </TableRow>
        )}

        {sales.map((sale) => {
          const names = sale.drug_names.join(", ");

          return (
            <TableRow key={sale.id}>
              <TableCell className="max-w-40 whitespace-normal">
                <p className="line-clamp-2 font-medium" title={names}>
                  {names}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(sale.sale_date), "d MMM yyyy", {
                    locale: idLocale,
                  })}{" "}
                  · {sale.sale_shift}
                </p>
              </TableCell>

              <TableCell className="text-right">
                {rupiah.format(sale.amount)}
              </TableCell>

              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontalIcon />
                      <span className="sr-only">Buka menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onEdit(sale)}>
                      <Edit />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => onDelete(sale)}
                    >
                      <Trash />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}