"use client";

import { useMemo, useState } from "react";
import {
  BedDouble,
  ChevronDown,
  Download,
  MessageCircle,
  Receipt,
  ShoppingBag,
  Syringe,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  filterOtcSales,
  filterVisits,
  getDefaultFilters,
  VisitFilterBar,
  VisitFilters,
} from "@/app/visits/_components/filters-visit";
import {
  buildKpis,
  buildReport,
  ReportRole,
  StaffPerf,
} from "./dashboard-data";
import { OtcSaleRow, ROOMS, VisitRow } from "@/app/visits/schema";
import { rupiah } from "@/app/visits/utils";
import { DashboardCharts } from "./dashboard-charts";
import { ReportReviewDialog } from "./report-review-dialog";
import { DutyEntry } from "@/app/visits/data";
import { useEffect, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  monthRange,
  payrollPeriod,
  periodLabel,
  periodOptions,
  todayYmd,
} from "@/lib/periods";
import { buildMonthlyCharts } from "./dashboard-data";
import type { MonthlyChartData } from "../data";
import { format } from "date-fns";
import { CashLedgerDialog } from "./cash-ledger-dialog";
import { toast } from "sonner";
import { reportSlots } from "@/lib/cash";
import { getCashSummary, type CashSummary } from "@/app/dashboard/cash-data";
import type {
  CashEntryRow,
  CashFormType,
  StaffOption,
} from "@/app/visits/schema";

// state dan komponen filter yang sudah ada

// ===== DATA DUMMY =====

const ROLES = ["Dokter", "Perawat", "Farmasi/Kasir", "Pendaftaran"];

export type ReportResult = { text: string; warnings: string[] };

export default function DashboardSummary({
  visits,
  otcSales,
  inpatients,
  roster,
  monthly,
  staffPerf,
  periodStart,
  cashEntries,
  staff,
}: {
  visits: VisitRow[];
  otcSales: OtcSaleRow[];
  inpatients: VisitRow[];
  roster: DutyEntry[];
  monthly: MonthlyChartData;
  staffPerf: StaffPerf[];
  periodStart: string;
  cashEntries: CashEntryRow[];
  staff: StaffOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [filters, setFilters] = useState<VisitFilters>(getDefaultFilters);
  const [role, setRole] = useState("all");
  const [cashOpen, setCashOpen] = useState(false);

  const [cashKind, setCashKind] = useState<CashFormType["kind"]>("Setor");

  const ROLE_MATCH: Record<string, (p: StaffPerf) => boolean> = {
    Dokter: (p) => p.doctor > 0,
    Perawat: (p) => p.nurse > 0,
    "Farmasi/Kasir": (p) => p.rx > 0 || p.trx > 0,
    Pendaftaran: (p) => p.registered > 0,
  };

  const setParam = (key: string, value: string) => {
    const q = new URLSearchParams(sp.toString());
    q.set(key, value);
    startTransition(() =>
      router.replace(`${pathname}?${q}`, { scroll: false }),
    );
  };

  // grafik mengikuti bulan dari hari yang dipilih di filter tanggal
  const selectedMonth = monthRange(
    filters.range?.from ? format(filters.range.from, "yyyy-MM-dd") : todayYmd(),
  ).key;
  useEffect(() => {
    if (selectedMonth !== monthly.month) setParam("month", selectedMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, monthly.month]);

  const charts = useMemo(() => buildMonthlyCharts(monthly), [monthly]);
  const rows = role === "all" ? staffPerf : staffPerf.filter(ROLE_MATCH[role]);

  const periods = periodOptions(todayYmd());
  const periodText = periodLabel(payrollPeriod(periodStart));
  const periodList = periods.some((p) => p.value === periodStart)
    ? periods
    : [{ value: periodStart, label: periodText }, ...periods];

  const exportMonthly = () => console.log("export bulanan", periodText, rows);
  const isOwner = true; // TODO: ambil dari peran user yang login
  const WA_ROLES: ReportRole[] = [
    "Pendaftaran",
    "Perawat",
    "Farmasi",
    "Keuangan",
    "Makan",
  ];
  const fv = useMemo(() => filterVisits(visits, filters), [visits, filters]);
  const fs = useMemo(
    () => filterOtcSales(otcSales, filters),
    [otcSales, filters],
  );
  const k = useMemo(
    () => buildKpis(fv, fs, inpatients.length),
    [fv, fs, inpatients],
  );
  const [review, setReview] = useState<{
    role: ReportRole;
    text: string;
    warnings: string[];
  } | null>(null);

  const openReview = async (reportRole: ReportRole) => {
    try {
      let cash: CashSummary | undefined;
      if (reportRole === "Keuangan") {
        const { from, to } = reportSlots(filters);
        cash = await getCashSummary(from, to);
      }
      setReview({
        role: reportRole,
        ...buildReport(
          reportRole,
          fv,
          fs,
          filters,
          [...visits, ...inpatients],
          roster,
          inpatients, // laporan Makan
          cash, // laporan Keuangan
        ),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memuat laporan");
    }
  };

  const KPIS = [
    {
      label: "Total Kunjungan",
      value: String(k.total),
      note: `${k.longStay} rawat inap / home visit`,
      icon: Users,
    },
    {
      label: "Sedang Dirawat",
      value: String(k.inpatients),
      note: `dari ${ROOMS.length} kamar`,
      icon: BedDouble,
    },
    {
      label: "Pendapatan Terbayar",
      value: rupiah.format(k.paid),
      note: `${k.payCount} pembayaran · tanpa BPJS`,
      icon: Wallet,
    },
    {
      label: "Sisa Tagihan",
      value: rupiah.format(k.outstanding),
      note: `${k.unpaid} kunjungan`,
      icon: Receipt,
    },
    {
      label: "Penjualan Apotek",
      value: rupiah.format(k.otc),
      note: `${k.otcCount} transaksi`,
      icon: ShoppingBag,
    },
    {
      label: "Total Tindakan",
      value: String(k.treatments),
      icon: Syringe,
      note: k.total
        ? `rata-rata ${(k.treatments / k.total).toFixed(1)} per kunjungan`
        : "-",
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
          <VisitFilterBar value={filters} onChange={setFilters} />
          <Button variant="outline" onClick={() => setCashOpen(true)}>
            <Wallet className="size-4" />
            Catat Kas
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MessageCircle className="size-4" />
                Kirim Laporan
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Sesuai filter tanggal & shift
              </DropdownMenuLabel>
              {WA_ROLES.map((r) => (
                <DropdownMenuItem key={r} onSelect={() => openReview(r)}>
                  {r}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
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
      <DashboardCharts data={charts} />

      {/* Tabel performa staf + export bulanan */}
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Performa Staf</CardTitle>
            <CardDescription>
              Periode {periodText} · bandingkan hanya dengan peran yang sama
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Peran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua peran</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isOwner && (
              <>
                <Select
                  value={periodStart}
                  onValueChange={(v) => setParam("period", v)}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodList.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={exportMonthly}>
                  <Download className="size-4" />
                  Export Bulanan
                </Button>
              </>
            )}
          </div>
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
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Belum ada data.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.registered}</TableCell>
                  <TableCell>
                    {p.doctor} / {p.nurse}
                  </TableCell>
                  <TableCell>
                    {p.op} / {p.asst}
                  </TableCell>
                  <TableCell>{p.rx}</TableCell>
                  <TableCell>
                    {p.trx} · {rupiah.format(p.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ReportReviewDialog
        open={!!review}
        onOpenChange={(open) => {
          if (!open) setReview(null);
        }}
        title={`Laporan ${review?.role ?? ""}`}
        text={review?.text ?? ""}
        warnings={review?.warnings ?? []}
      />
      <CashLedgerDialog
        open={cashOpen}
        onOpenChange={setCashOpen}
        entries={cashEntries}
        staff={staff}
      />
    </main>
  );
}
