import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { formatDateIndo } from "./format";

interface RawAttendance {
  date: string;
  shift: string;
  staff_id: string;
}

interface Staff {
  id: string;
  name: string;
}

export async function exportAttendance(
  initialAttendance: RawAttendance[],
  staffList: Staff[],
  currentMountName: string = "Laporan",
) {
  // 1. Inisialisasi Workbook ExcelJS
  const workbook = new ExcelJS.Workbook();

  // 2. Lakukan perulangan untuk setiap staf (1 staf = 1 Sheet)
  staffList.forEach((staff) => {
    // Filter data kehadiran khusus untuk staf ini saja
    const staffAttendance = initialAttendance
      .filter((att) => att.staff_id === staff.id)
      // Urutkan berdasarkan tanggal terbaru
      .sort((a, b) => b.date.localeCompare(a.date));

    // Validasi nama sheet (maksimal 31 karakter aturan Excel, bersihkan karakter aneh)
    const sheetName = staff.name
      .substring(0, 30)
      .replace(/[*?:/[\]]/g, "");
    const worksheet = workbook.addWorksheet(sheetName);

    // 3. Atur Styling & Judul di dalam Sheet Staf
    worksheet.mergeCells("A1:C1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `LAPORAN PRESENSI BULANAN - ${staff.name.toUpperCase()}`;
    titleCell.font = { name: "Arial", size: 14, bold: true };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    worksheet.getRow(1).height = 30;

    // 4. Definisikan Struktur Kolom Tabel
    worksheet.getRow(3).values = ["Tanggal", "Shift"];
    worksheet.columns = [
      { key: "date", width: 25 },
      { key: "shift", width: 15 },
    ];

    // Styling Header Tabel (Baris ke-3)
    const headerRow = worksheet.getRow(3);
    headerRow.height = 21;
    headerRow.eachCell((cell) => {
      cell.font = {
        name: "Arial",
        size: 11,
        bold: true,
        color: { argb: "FFFFFF" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1E3A8A" }, // Warna Biru Gelap Profesional (Navy)
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "medium" },
        right: { style: "thin" },
      };
    });

    // 5. Masukkan Data Presensi Staf
    staffAttendance.forEach((att) => {
      const row = worksheet.addRow({
        date: formatDateIndo(att.date),
        shift: att.shift,
      });

      // styling baris data
      row.height = 21;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Arial", size: 10 };
        // kolom shift center, tanggal rata kiri
        cell.alignment = {
          vertical: "middle",
          horizontal: colNumber === 1 ? "left" : "center",
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // 6. Baris Total Akumulasi Masuk di Bagian Paling Bawah Sheet
    const totalRowNumber = staffAttendance.length + 4;
    worksheet.mergeCells(`A${totalRowNumber}`);

    const labelTotalCell = worksheet.getCell(`A${totalRowNumber}`);
    labelTotalCell.value = "TOTAL MASUK (SHIFT)";
    labelTotalCell.font = { name: "Arial", size: 11, bold: true };
    labelTotalCell.alignment = { vertical: "middle", horizontal: "right" };

    const valueTotalCell = worksheet.getCell(`B${totalRowNumber}`);

    // Menggunakan formula SUM otomatis bawaan Excel dari baris pertama data sampai terakhir
    valueTotalCell.value =
      staffAttendance.length > 0
        ? {
            formula: `SUM(B4:B${totalRowNumber - 1})`,
            result: staffAttendance.length,
          }
        : 0;
    valueTotalCell.font = { name: "Arial", size: 11, bold: true };
    valueTotalCell.alignment = { vertical: "middle", horizontal: "center" };

    // styling baris total
    const totalRow = worksheet.getRow(totalRowNumber);
    totalRow.height = 21;
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F3F4F6" }, // Abu-abu terang
      };
      cell.border = {
        top: { style: "medium" },
        left: { style: "thin" },
        bottom: { style: "medium" },
        right: { style: "thin" },
      };
    });
  });

  // 7. Generate File & Download langsung di Browser
  const buffer = await workbook.xlsx.writeBuffer();
  const fileType =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const blob = new Blob([buffer], { type: fileType });

  // Format Nama File: Laporan_Absensi_Juni_2026.xlsx
  saveAs(blob, `Laporan_Absensi${currentMountName.replace(/\s+/g, "_")}.xlxs`);
}
