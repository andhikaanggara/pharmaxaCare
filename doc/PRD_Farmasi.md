## PRD Modul Farmasi

**Tujuan Halaman:** Mengelola antrean resep dari pendaftaran/perawat, memproses penjualan obat bebas (apotek), dan menginput kunjungan langsung dari sisi farmasi.

### 1. Struktur Layout Halaman Utama (`app/(dashboard)/farmasi/page.tsx`)

Halaman ini menggunakan kombinasi _Server Components_ untuk inisialisasi data dan _Client Components_ untuk interaktivitas tabel dan form.

- **Header Actions:**
- Tombol **"Tambah Kunjungan"** -> Membuka form lengkap (Drawer/Dialog).
- Tombol **"Tambah Penjualan"** -> Membuka form ringkas obat bebas (Drawer/Dialog).

- **Container 1: Antrean Farmasi (Belum Diinput)**
- Menampilkan daftar pasien dari `visit_pendaftaran` yang statusnya belum diselesaikan oleh farmasi (misal: `status_data = 'kurang farmasi'`).
- Aksi: Tombol "Proses" yang akan membuka **Form Tambah Kunjungan** dengan data yang sudah terisi otomatis (Auto-fill).

- **Container 2: Riwayat Input Farmasi (Selesai)**
- Memiliki filter **Range Picker Tanggal** (Default: Hari Ini) dan **Filter Shift** (Default: Shift saat ini).
- Menampilkan data gabungan dari `visit_pendaftaran` dan `visit_farmasi_pembayaran` yang sudah selesai diinput.

---

### 2. Spesifikasi Form Tambah Kunjungan

Form ini bersifat dinamis. Bisa digunakan untuk menarik data kunjungan yang sudah ada, atau menginput kunjungan baru langsung dari loket farmasi.

**A. Field Otomatis (Bisa diubah oleh user):**

- **Tanggal Dispensing:** Default otomatis hari ini (`new Date()`).
- **Shift Dispensing:** Default kalkulasi otomatis berdasarkan jam saat ini.
- `07:00 - 13:59` -> Pagi
- `14:00 - 20:59` -> Sore
- `21:00 - 06:59` -> Malam

**B. Field Identifikasi & Relasi:**

- **Staf Farmasi:** `Combobox` (dari `master_staff`, filter role Farmasi).
- **Staf Apoteker:** `Combobox` (dari `master_staff`, filter role Apoteker).
- **Cari Kunjungan:** `Combobox`. Menarik data dari `visit_pendaftaran` dengan kondisi:
- `penanganan` = Ranap / Homevisit **OR**
- `status_bayar` = Piutang **OR** (catatan: pastikan kolom ini ada di skema jika digunakan)
- `status_data` = "kurang farmasi".
- _Tampilan Dropdown:_ [Nama Pasien] - [Poli] - [Penjamin] - [Penanganan].
- _Logika:_ Jika dipilih, auto-fill form di bawahnya.

- **Cari Nama Pasien:** `Combobox` (dari `master_patients`). Digunakan jika kunjungan pasien belum didaftarkan oleh user pendaftaran dan langsung ke farmasi.

**C. Field Data Kunjungan & Klinis:**

- **Poli:** `Select` (Umum / Gigi).
- **Penjamin:** `Select` (Mandiri / BPJS).
- **Penanganan:** `Select` (Rawat Jalan / Rujukan / Surat Sehat / Copy Resep / Lab / Observasi / Infus Vitamin / Rawat Inap / Home Visit).
- **Jenis Resep:** `Select` (Biasa / Racikan / Tidak Ada).

**D. Field Kondisional (Hanya tampil jika Penanganan = "Rawat Inap" atau "Home Visit"):**

- **Kamar:** `Select` (Anggrek / Bougenvile / Cempaka / Dahlia / Rumah Pasien).
- **Tanggal Datang:** Sama dengan Tanggal Dispensing awal.
- **Tanggal Pulang:** `DatePicker` (Default: hari ini).
- **Lama Perawatan:** _Auto-calculated_ (Tanggal Pulang - Tanggal Datang, format angka/hari).
- **Cara Pulang:** `Select` (Sembuh / APS / Meninggal).

**E. Field Transaksi:**

- **Nominal Terbayar:** `Input` (Number/String). _Auto-formatting_ menjadi `Rp x.xxx.xxx` saat diketik. Disimpan ke _database_ sebagai angka murni (misal: `50000`).
- **Metode Pembayaran:** `Select` (Cash / BPJS / Transfer / QRIS / Tidak Bayar).

---

### 3. Spesifikasi Form Tambah Penjualan Apotek

Form ini jauh lebih ringkas dan difokuskan untuk kecepatan layanan pembeli obat bebas tanpa resep dokter.

- **Nominal Terbayar:** `Input` (Number/String). _Auto-formatting_ menjadi `Rp x.xxx.xxx` saat diketik. Disimpan ke _database_ sebagai angka murni (misal: `50000`).
- **Metode Pembayaran:** `Select` (Cash / Transfer / QRIS / Tidak Bayar).
- _Logika Sistem (Background):_ Karena skema tabel `visit_farmasi_pembayaran` wajib berelasi dengan `id_visit`, maka saat form ini di-submit, sistem harus secara _otomatis_ (di balik layar) membuat data `visit_pendaftaran` dengan `id_pasien` khusus "Pasien Umum Apotek", poli "Apotek", dan penanganan "Rawat Jalan", lalu menyambungkan `id_visit` tersebut ke data farmasi ini.
