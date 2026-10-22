"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Clipboard, PlusCircle, Search, ShoppingBag } from "lucide-react";

export default function VisitsClient() {
  return (
    <main className="mx-auto flex h-[calc(100vh-64px)] w-full flex-col gap-6 overflow-hidden p-4 md:p-6">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Clipboard />
          Visit Management
        </h1>

        <div className="flex gap-2 w-full md:w-auto">
          <Button
            disabled
            variant="default"
            className="flex-1 md:flex-none gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Tambah Kunjungan
          </Button>
          <Button
            disabled
            variant="outline"
            className="flex-1 md:flex-none gap-2"
          >
            <ShoppingBag className="h-4 w-4" />
            Tambah Penjualan
          </Button>
        </div>
      </section>

      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="relative md:w-70">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            disabled
            type="text"
            placeholder="Search codes or names..."
            value={[]}
            onChange={(e) => console.log("Search query:", e.target.value)}
            className="w-full pl-9 pr-4"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button>Date Picker</Button>
          <Button>Shift Picker</Button>
          <Button>filter</Button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-auto">
        {/* Kunjungan Pasien */}
        <Card className="col-span-2 flex flex-col h-full">
          <CardHeader>
            <CardTitle>Kunjungan Pasien</CardTitle>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          {/* Rawat Inap */}
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Rawat Inap</CardTitle>
            </CardHeader>
          </Card>

          {/* Penjualan Obat */}
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Penjualan Obat</CardTitle>
            </CardHeader>
            <CardContent>Konten Penjualan Obat</CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
