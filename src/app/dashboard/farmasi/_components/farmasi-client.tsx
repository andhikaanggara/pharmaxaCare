"use client";

import { useState } from "react";
import {
  Pill,
  History,
  ClipboardList,
  PlusCircle,
  ShoppingBag,
  MoreVertical,
  Edit,
  Trash,
} from "lucide-react";

// UI COMP
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FarmasiVisitForm } from "./farmasi-visit-form";

interface FarmasiClientProps {
  initialPending: any[];
  initialCompleted: any[];
}

export default function FarmasiClient({
  initialPending,
  initialCompleted,
}: FarmasiClientProps) {
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false);
  const [staffData, setStaffData] = useState([]);
  const [patientData, setPatientData] = useState([]);
  const [visitData, setVisitData] = useState([]);

  const handleAddKunjungan = () => {
    setIsVisitFormOpen(true);
  };

  const handleAddPenjualan = () => {
    console.log("Trigger: Tambah Penjualan");
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] w-full flex-col gap-6 overflow-hidden p-4 md:p-6">
      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" />
            Modul Farmasi
          </h1>
          <p className="text-muted-foreground text-sm">
            Kelola antrean resep dan penjualan obat bebas.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button
            onClick={handleAddKunjungan}
            variant="default"
            className="flex-1 md:flex-none gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Tambah Kunjungan
          </Button>
          <Button
            onClick={handleAddPenjualan}
            variant="outline"
            className="flex-1 md:flex-none gap-2"
          >
            <ShoppingBag className="h-4 w-4" />
            Tambah Penjualan
          </Button>
        </div>
      </div>

      {/* CONTAINER 2: RIWAYAT INPUT FARMASI (SELESAI) */}
      <Card className="col-span-3 flex flex-col h-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle>Riwayat Selesai</CardTitle>
          </div>
          <CardDescription>
            Data kunjungan dan penjualan yang telah selesai diinput.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          {/* Filter placeholder */}
          <div className="flex gap-2 mb-4">
            <div className="h-9 w-40 rounded bg-muted animate-pulse" />
            <div className="h-9 w-24 rounded bg-muted animate-pulse" />
          </div>

          <div className="rounded-md border bg-background overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nama Pasien</TableHead>
                  <TableHead>Poli</TableHead>
                  <TableHead>Penjamin</TableHead>
                  <TableHead>Penanganan</TableHead>
                  <TableHead>Staff Farmasi</TableHead>
                  <TableHead>Jenis Resep</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Cara Bayar</TableHead>
                  <TableHead className="w-24 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialCompleted.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Belum ada riwayat transaksi hari ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  initialCompleted.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{item.nama_pasien}</TableCell>
                      <TableCell>{item.poli}</TableCell>
                      <TableCell>{item.penjamin}</TableCell>
                      <TableCell>{item.penanganan}</TableCell>
                      <TableCell>{item.staff_farmasi}</TableCell>
                      <TableCell>{item.jenis_resep}</TableCell>
                      <TableCell>Rp {item.nominal}</TableCell>
                      <TableCell>{item.cara_bayar}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-destructive">
                              <Trash className="h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <FarmasiVisitForm
        open={isVisitFormOpen}
        onOpenChange={setIsVisitFormOpen}
        staffOptions={staffData} // Data dari API/Supabase
        patientOptions={patientData}
        visitOptions={visitData}
      />
    </div>
  );
}
