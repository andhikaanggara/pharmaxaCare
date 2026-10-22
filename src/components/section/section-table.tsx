"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Import komponen asli Shadcn UI
import { Button } from "@/components/ui/button";
import { PencilIcon, Trash2Icon } from "lucide-react";

// Definisikan tipe untuk konfigurasi kolom desktop
export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface SectionTableProps<T> {
  data: T[];
  header: TableColumn<T>[];
  mobileRender: (item: T) => React.ReactNode;
  emptyMessage?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  isPending?: boolean;
}

export function SectionTable<T extends { id: string | number }>({
  data,
  header,
  mobileRender,
  emptyMessage = "Belum ada data.",
  onEdit,
  onDelete,
  isPending = false,
}: SectionTableProps<T>) {
  const hasActions = onEdit || onDelete;

  return (
    <div className="flex-1 min-h-0">
      {/* Mobile View: Tampil Card */}
      <div className="grid grid-cols-1 gap-4 md:hidden overflow-auto max-h-full relative">
        {data.length === 0 ? (
          <div className="text-center p-4 text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          data.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 p-4 border rounded-lg shadow-sm bg-background"
            >
              {mobileRender(item)}
            </div>
          ))
        )}
      </div>

      {/* Desktop View: Menggunakan struktur tabel murni Shadcn UI */}
      <div className="rounded-xl border border-border bg-background shadow-sm hidden md:block overflow-auto h-full relative">
        <Table>
          <TableHeader className="bg-muted/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
            <TableRow>
              <TableHead className="font-semibold px-4 w-10">No</TableHead>
              {header.map((col, index) => (
                <TableHead key={index} className="font-semibold">
                  {col.header}
                </TableHead>
              ))}
              {hasActions && (
                <TableHead className="text-center w-32 font-semibold">
                  Aksi
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={header.length + (hasActions ? 1 : 0)}
                  className="text-muted-foreground text-center h-24"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, i) => (
                <TableRow key={item.id}>
                  <TableCell className="px-5">{i + 1}</TableCell>
                  {header.map((col, index) => (
                    <TableCell key={index} className={col.className}>
                      {typeof col.accessor === "function"
                        ? col.accessor(item)
                        : (item[col.accessor] as React.ReactNode)}
                    </TableCell>
                  ))}

                  {/* Kolom Aksi Otomatis jika props fungsi dikirim */}
                  {hasActions && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onEdit && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => onEdit(item)}
                          >
                            <PencilIcon className="h-3 w-3 text-blue-600" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="cursor-pointer"
                            disabled={isPending}
                            onClick={() => onDelete(item)}
                          >
                            <Trash2Icon className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
