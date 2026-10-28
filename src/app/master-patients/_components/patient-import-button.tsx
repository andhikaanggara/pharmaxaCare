"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Summary = {
  total: number;
  valid: number;
  inserted: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

async function callImport(file: File, dryRun: boolean): Promise<Summary> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("dryRun", String(dryRun));
  const res = await fetch("/api/patients/import", { method: "POST", body: fd });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || "error" in json) {
    throw new Error(json?.error ?? "Gagal memproses file");
  }
  return json.data as Summary;
}

async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([
    [
      "Nama",
      "Jenis Kelamin",
      "Tanggal Lahir",
      "No HP",
      "Alamat",
      "Kelompok",
      "Jenis Pasien",
    ],
    [
      "Budi Santoso",
      "L",
      "1990-05-17",
      "081234567890",
      "Jl. Merdeka No. 1",
      "Umum",
      "Baru",
    ],
  ]);
  ws["!cols"] = [24, 14, 14, 16, 32, 14, 14].map((wch) => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pasien");
  XLSX.writeFile(wb, "template-pasien.xlsx");
}

const Stat = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: string;
}) => (
  <div className="rounded-md border p-2 text-center">
    <p className={`text-xl font-bold ${tone ?? ""}`}>{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export function PatientImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"preview" | "import" | null>(null);

  const close = () => {
    setOpen(false);
    setFile(null);
    setSummary(null);
    setError(null);
    setBusy(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // Pilih file: langsung pratinjau (belum menyimpan apa pun)
  const onPick = async (f: File | null) => {
    setFile(f);
    setSummary(null);
    setError(null);
    if (!f) return;
    setBusy("preview");
    try {
      setSummary(await callImport(f, true));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memproses file");
    } finally {
      setBusy(null);
    }
  };

  const onImport = async () => {
    if (!file) return;
    setBusy("import");
    try {
      const r = await callImport(file, false);
      toast.success(`${r.inserted} pasien berhasil diimpor`);
      router.refresh();
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengimpor");
      setBusy(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (busy === "import") return;
        if (o) setOpen(true);
        else close();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="size-4" />
          Import Excel
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Pasien dari Excel</DialogTitle>
          <DialogDescription>
            Format .xlsx, .xls, atau .csv. Maksimal 500 baris per file.
          </DialogDescription>
        </DialogHeader>

        <Button
          variant="link"
          size="sm"
          className="h-auto justify-start p-0"
          onClick={downloadTemplate}
        >
          <Download className="size-4" />
          Download template
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        <Button
          variant="outline"
          className="h-20 flex-col gap-1 border-dashed"
          disabled={busy !== null}
          onClick={() => inputRef.current?.click()}
        >
          {busy === "preview" ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <FileSpreadsheet className="size-5" />
          )}
          <span className="text-sm font-normal">
            {file ? file.name : "Pilih file Excel"}
          </span>
        </Button>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {summary && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Stat
                label="Akan ditambah"
                value={summary.valid}
                tone="text-green-600"
              />
              <Stat label="Duplikat dilewati" value={summary.skipped} />
              <Stat
                label="Baris error"
                value={summary.errors.length}
                tone={summary.errors.length ? "text-destructive" : ""}
              />
            </div>
            {summary.errors.length > 0 && (
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2 text-xs">
                {summary.errors.map((e) => (
                  <li key={e.row}>
                    <span className="font-medium">Baris {e.row}:</span>{" "}
                    {e.message}
                  </li>
                ))}
              </ul>
            )}
            {summary.errors.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Baris error tidak diimpor. Perbaiki di file lalu unggah ulang;
                data yang sudah masuk tidak akan terduplikasi.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={close}
            disabled={busy === "import"}
          >
            Batal
          </Button>
          <Button
            onClick={onImport}
            disabled={!summary || summary.valid === 0 || busy !== null}
          >
            {busy === "import" && <Loader2 className="size-4 animate-spin" />}
            Import {summary?.valid ?? 0} pasien
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
