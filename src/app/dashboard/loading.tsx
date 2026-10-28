import {
  BedDouble,
  ChevronDown,
  MessageCircle,
  Receipt,
  ShoppingBag,
  Syringe,
  Users,
  Wallet,
} from "lucide-react";
import { VisitFilterBar } from "../visits/_components/filters-visit";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardCharts } from "./_components/dashboard-charts";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DashboardSummary() {
  const KPIS = [
    {
      label: "Total Kunjungan",
      value: "",
      note: `rawat inap / home visit`,
      icon: Users,
    },
    {
      label: "Sedang Dirawat",
      value: "",
      note: "",
      icon: BedDouble,
    },
    {
      label: "Pendapatan Terbayar",
      value: "",
      note: "",
      icon: Wallet,
    },
    {
      label: "Sisa Tagihan",
      value: "",
      note: "",
      icon: Receipt,
    },
    {
      label: "Penjualan Apotek",
      value: "",
      note: "",
      icon: ShoppingBag,
    },
    {
      label: "Total Tindakan",
      value: "",
      icon: Syringe,
      note: "",
    },
  ];

  return (
    <main className="mx-auto flex w-full flex-col gap-6 p-4 md:p-6">
      {/* Header: judul, filter, export harian */}
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Ringkasan Dashboard
        </h1>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MessageCircle className="size-4" />
                Kirim Laporan
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
          </DropdownMenu>
        </div>
      </section>

      {/* Kartu ringkasan */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {KPIS.map(({ label, value, note, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription>{label}</CardDescription>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{note}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Grafik (placeholder; ganti dengan shadcn Chart) */}

      {/* Tabel performa staf + export bulanan */}
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Performa Staf</CardTitle>
            <CardDescription>
              Bandingkan hanya dengan peran yang sama
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2"></div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staf</TableHead>
                <TableHead>Didaftarkan</TableHead>
                <TableHead>Kunjungan (Dokter / Perawat)</TableHead>
                <TableHead>Tindakan (Op / Asis)</TableHead>
                <TableHead>Resep</TableHead>
                <TableHead>Transaksi Kasir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody></TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
