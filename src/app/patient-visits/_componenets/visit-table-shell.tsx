import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
} from "@/components/ui/table";

const tableHead = [
  "No",
  "Tanggal",
  "Shift",
  "Nama Pasien",
  "Poli",
  "Resep",
  "Tindakan",
  "Harga",
  "Metode",
];

interface IProps {
  children: React.ReactNode;
}

export function VisitTableShell({ children }: IProps) {
  return (
    <div className="rounded-xl border border-border bg-background shadow-sm overflow-auto h-full relative">
      <Table>
        <TableHeader className="bg-muted/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
          {tableHead.map((r) => (
            <TableHead key={r}>{r}</TableHead>
          ))}
          <TableHead className="text-center w-32 font-semibold whitespace-nowrap">
            Aksi
          </TableHead>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}
