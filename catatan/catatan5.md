# Catatan 5: Penyempurnaan Fitur Santri Mundur & Pembuatan Fitur Batal Mundur

Dokumen ini merangkum seluruh perubahan dan penambahan fitur yang dilakukan pada modul manajemen santri, khususnya terkait pengelolaan santri yang membatalkan pendaftaran (Mundur) dan fitur pembatalannya (Undo Mundur).

## 1. Penyempurnaan Fitur Proses Santri Mundur
- **Masalah Sebelumnya:** Tombol "Mundur" pada tabel data santri tidak memunculkan popup karena masalah pada ruang lingkup (*scope*) fungsi Javascript, serta kalkulasi refund yang tidak otomatis. Selain itu, perhitungan Target Pendapatan di Dashboard tidak berkurang meskipun ada santri yang mundur.
- **Solusi & Perbaikan:**
  - **Perbaikan UI & Javascript (`global.js`, `footer.ejs`):** Mengeluarkan fungsi `promptMundur` agar dapat diakses secara global, mengaktifkan library `Select2` pada dropdown "Alasan Mundur", dan melakukan bump versi cache ke `v=8`.
  - **Otomatisasi Nominal Refund:** Saat tombol "Mundur" ditekan, sistem otomatis melakukan fetch data ke backend untuk mengambil `totalBayar` saat ini, lalu menghitung nominal refund berdasarkan pilihan (Meninggal Dunia = 100%, Pindah Tugas = 50%, Lainnya = 0%).
  - **Perbaikan Format Kwitansi Pengeluaran (`santriController.js`):** Mengubah format nomor transaksi dari `TRX-(timestamp)` menjadi format standar kwitansi pengeluaran lembaga, yaitu `KWI-OUT/xxx/MM/YYYY`.
  - **Penyesuaian Target Pendapatan (`dashboardController.js`):** Mengabaikan (mem-filter) santri dengan status "Mundur" dari kalkulasi `Target Pendapatan`, sehingga target penerimaan lembaga berkurang secara real-time.
  - **Penambahan Kolom Query (`TunggakanModel.js`):** Memastikan `totalBayar` ikut ditarik saat API pencarian santri dijalankan agar popup bisa menampilkan uang yang sudah masuk dengan benar.

## 2. Pembuatan Fitur Batal Mundur (Undo Mundur)
- **Kebutuhan:** Memungkinkan admin untuk mengembalikan status santri yang sudah terlanjur diatur sebagai "Mundur" kembali menjadi "Aktif", dengan perlakuan akuntansi (cashflow) yang sangat ketat agar laporan keuangan tidak berantakan.
- **Implementasi UI (`table-actions.ejs`, `global.js`):**
  - Menambahkan tombol biru muda **"Batal Mundur"** yang hanya muncul pada santri berstatus "Mundur".
  - Membuat popup konfirmasi khusus `promptUndoMundur` yang menampilkan 2 buah pilihan *(radio buttons)* mengenai cara penyesuaian tagihan.
- **Opsi Pemulihan Tagihan (Logika Bisnis di `santriController.js` & `TunggakanModel.js`):**
  1. **Mulai dari Awal (Reset):** Status santri kembali "Aktif", `Total Bayar` direset menjadi 0, dan `Sisa Tagihan` kembali full. Riwayat transaksi masa lalu (pemasukan & refund) dibiarkan sebagai riwayat hak milik lembaga.
  2. **Lanjutkan Pembayaran Terakhir:** Melanjutkan sisa cicilan sebelumnya. Riwayat transaksi Refund *tidak dihapus* agar cashflow aman, tetapi `Total Bayar` anak pada tagihan akan dikurangi sebesar nominal uang yang dulu pernah di-refund kepadanya. Sehingga sisa hutangnya dikalkulasi ulang secara otomatis dan presisi (100% klop).
- **Endpoint Baru (`adminRoutes.js`):** 
  - `POST /santri/undo-mundur/:id`
  - `POST /santri-daftar-ulang/undo-mundur/:id`

## 3. Penanganan Limitasi cPanel saat Git Pull
- **Masalah:** Terjadi error `fatal: unable to create threaded lstat: Resource temporarily unavailable` saat mengeksekusi `./restart-server.sh` di server cPanel. Hal ini disebabkan oleh pembatasan jumlah *Entry Processes* (EP) atau *thread* oleh pihak hosting.
- **Solusi:** Memberikan perintah `git config core.preloadIndex false` pada terminal cPanel untuk memaksa Git melakukan pemindaian file menggunakan 1 *thread* tunggal saja, sehingga tidak menyentuh limitasi cPanel.
