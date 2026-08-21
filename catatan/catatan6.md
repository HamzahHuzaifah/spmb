# Dokumentasi Perbaikan dan Pembaruan Sistem SPMB (Catatan 6)

Dokumen ini berisi rangkuman dari seluruh perbaikan, pembaruan antarmuka, dan sinkronisasi data yang telah dilakukan pada sistem.

## 1. Refactoring dan Pembaruan Antarmuka (UI/UX)
- **Pemisahan CSS dan JS (Clean Code):** Menghapus kode CSS (`<style>`) dan JavaScript (`<script>`) yang bersifat *inline* pada file-file *views* (seperti `laporan.ejs`, `santri.ejs`, `santri-daftar-ulang.ejs`). Kode-kode tersebut telah diekstrak dan dipindahkan ke file terpisah di dalam direktori `public/css/` dan `public/js/` agar arsitektur kode lebih rapi dan modular.
- **Implementasi Premium Banner:** Menambahkan komponen *banner header premium* dengan berbagai tema warna pada halaman-halaman utama:
  - `laporan.ejs` (Laporan Keuangan Global - Ungu)
  - `santri.ejs` (Master Data Santri Baru - Hijau)
  - `santri-daftar-ulang.ejs` (Master Data Daftar Ulang - Oranye)
  - `tagihan.ejs` (Data Tagihan Santri Baru - Ungu)
  - `tagihan-daftar-ulang.ejs` (Data Tagihan Daftar Ulang - Oranye)
  - `tunggakan.ejs` (Data Tunggakan Santri Baru - Merah)
  - `tunggakan-daftar-ulang.ejs` (Data Tunggakan Daftar Ulang - Merah)

## 2. Klarifikasi Logika Tutup Buku (Hilangnya Tombol Aksi)
- Sempat dilaporkan bahwa tombol **Edit** dan **Hapus** pada tabel "Transaksi Terbaru" di Halaman Input Transaksi Keuangan menghilang.
- Setelah diperiksa, hal ini **bukanlah sebuah *bug***, melainkan bagian dari fitur **Tutup Buku** (`isTutupBuku`). Apabila sistem SPMB dalam masa *Tutup Buku*, seluruh akses form input dan perubahan transaksi manual dari sisi panitia akan dinonaktifkan secara sistem. Transaksi hanya akan masuk otomatis melalui sinkronisasi Web Keuangan SIKMA JIC.

## 3. Koreksi Penamaan Sistem (Typo SIGMA menjadi SIKMA)
- Terdapat salah ketik penamaan sistem di berbagai file dan *database*, di mana seharusnya bernama **"SIKMA"** namun tertulis **"SIGMA"**. Koreksi telah diterapkan pada seluruh bagian yang terdampak secara komprehensif:
  - **Database (`transaksi`):** Menjalankan *query* SQL `UPDATE transaksi SET inputOleh = 'SIKMA', dibayarkanKepada = 'SIKMA' WHERE inputOleh = 'SIGMA'` sehingga rekap data historis laporan lama tetap tersinkronisasi dengan benar.
  - **Backend Models (`TransaksiModel.js`):** Memperbaiki nama metode *query database*, contohnya dari `getSigmaNoTransaksi()` menjadi `getSikmaNoTransaksi()`.
  - **Backend Controllers (`laporanController.js` & `apiIntegrationController.js`):** Memperbaiki *hardcode* nama operator yang memicu penambahan data ke database via API, dan memperbaiki variabel logika pembagian tab laporan antara Internal SPMB dan SIKMA.
  - **Frontend UI (`laporan.ejs` & `laporan.js`):** Mengganti referensi ID HTML dan variabel dari `sigma-tab` ke `sikma-tab` serta `tabelLaporanSigma` ke `tabelLaporanSikma`.

## 4. Pembaruan Endpoint Integrasi API (SPMB ↔ SIKMA)
- Terdapat penambahan fungsi dan perbaikan logika krusial di `apiIntegrationController.js` guna menjaga akurasi tunggakan dan pembukuan:
  - **Identifikasi Ganda (No Transaksi):** Penyesuaian skrip otomatis pada `postBayarTunggakan` agar membaca `no_transaksi` asli dari SIKMA guna menghindari duplikasi.
  - **Endpoint Baru `postDeleteTunggakan`:** Memungkinkan Web SIKMA untuk mengirim perintah hapus transaksi ke SPMB. Sistem SPMB akan menelusuri data tunggakan (baik Santri Baru atau Daftar Ulang) dan mengembalikan saldo sisa tunggakan menjadi nominal semula sebelum transaksi dihapus, sekaligus membersihkan *log* transaksi dan laporannya.
  - **Endpoint Baru `postEditTunggakan`:** Memungkinkan Web SIKMA untuk mengubah transaksi yang sudah tercatat. Sistem SPMB akan menghitung selisih nominal baru dikurangi nominal lama, dan mengkalkulasikan kembali sisa tunggakan secara presisi serta mengubah data di laporan keuangan.
  - **Endpoint Baru `getSaldoPanitiaSpmb`:** Menambahkan *route* `api/saldo-panitia-spmb` untuk menjumlahkan seluruh `pemasukan` dikurangi `pengeluaran` yang bersumber **hanya** dari internal SPMB (mengabaikan setoran via SIKMA) sehingga saldo fisik yang ada di panitia PMB bisa dipantau secara langsung oleh SIKMA.
