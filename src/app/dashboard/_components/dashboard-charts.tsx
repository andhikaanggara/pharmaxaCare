"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { buildMonthlyCharts } from "./dashboard-data";
type Data = ReturnType<typeof buildMonthlyCharts>;

const cfg = {
  total: { label: "Jumlah", color: "var(--chart-1)" },
} satisfies ChartConfig;

function ChartCard({
  title,
  desc,
  empty,
  className,
  children,
}: {
  title: string;
  desc: string;
  empty: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent>
        {empty ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Belum ada data
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function TopBar({ data }: { data: { name: string; total: number }[] }) {
  return (
    <ChartContainer config={cfg} className="h-64 w-full">
      <BarChart data={data} layout="vertical">
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="name"
          type="category"
          width={120}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: string) =>
            v.length > 18 ? `${v.slice(0, 18)}…` : v
          }
        />
        <XAxis type="number" hide />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="total" fill="var(--color-total)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

function Donut({
  title,
  data,
}: {
  title: string;
  data: { name: string; total: number; fill: string }[];
}) {
  const config = Object.fromEntries(
    data.map((d) => [d.name, { label: d.name, color: d.fill }]),
  ) satisfies ChartConfig;
  return (
    <div>
      <p className="mb-1 text-center text-sm font-medium">{title}</p>
      <ChartContainer config={config} className="mx-auto h-44 w-full">
        <PieChart>
          <ChartTooltip
            content={<ChartTooltipContent nameKey="name" hideLabel />}
          />
          <Pie data={data} dataKey="total" nameKey="name" innerRadius={40} />
          <ChartLegend content={<ChartLegendContent nameKey="name" />} />
        </PieChart>
      </ChartContainer>
    </div>
  );
}

export function DashboardCharts({ data }: { data: Data }) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <ChartCard
        title="Tren Kunjungan"
        desc={`Per hari · ${data.monthLabel}`}
        className="lg:col-span-2"
        empty={data.total === 0}
      >
        <ChartContainer config={cfg} className="h-64 w-full">
          <LineChart data={data.perDay}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis
              allowDecimals={false}
              width={34}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              dataKey="total"
              stroke="var(--color-total)"
              strokeWidth={2}
              dot
            />
          </LineChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard
        title="Rata-rata Kunjungan per Shift"
        desc={`Per hari · ${data.monthLabel}`}
        empty={data.total === 0}
      >
        <ChartContainer config={cfg} className="h-64 w-full">
          <BarChart data={data.shifts}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis
              allowDecimals={false}
              width={34}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="total" fill="var(--color-total)" radius={4} />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard
        title="Guarantor & Departemen"
        desc={data.monthLabel}
        empty={data.total === 0}
      >
        <div className="grid grid-cols-2 gap-2">
          <Donut title="Guarantor" data={data.guarantor} />
          <Donut title="Departemen" data={data.department} />
        </div>
      </ChartCard>

      <ChartCard
        title="Diagnosis Teratas"
        desc={`10 teratas · ${data.monthLabel}`}
        empty={data.diagnoses.length === 0}
      >
        <TopBar data={data.diagnoses} />
      </ChartCard>

      <ChartCard
        title="Tindakan Teratas"
        desc={`10 teratas · ${data.monthLabel}`}
        empty={data.treatments.length === 0}
      >
        <TopBar data={data.treatments} />
      </ChartCard>
    </section>
  );
}
