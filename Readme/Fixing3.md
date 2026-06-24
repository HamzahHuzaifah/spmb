# Dokumentasi Perbaikan dan Pembaruan SPMB Web App (Bagian 3)

Berikut adalah ringkasan dari berbagai perbaikan fungsionalitas, logika database, perhitungan saldo running balance, dan tampilan (UI/UX) pada modul Laporan dan Cetak Laporan Keuangan SPMB JIC:

## 1. Perubahan Struktural & Integrasi Fitur
- **Penggunaan Iframe untuk Preview Laporan:** Mengubah sistem pop-up preview laporan yang sebelumnya menggunakan elemen modal inline HTML menjadi pop-up modal berbasis **Iframe** yang memanggil file view terpisah, yaitu `laporan-bulanan.ejs`. Perubahan ini membuat sistem cetak laporan sejalan dengan fitur cetak kwitansi transaksi yang sudah stabil.
- **Restorasi SweetAlert:** Mengembalikan validasi pilihan bulan dari alert bawaan Google/browser kembali menggunakan **SweetAlert** (`Swal.fire()`), sehingga alur peringatan interaktif terasa lebih modern dan konsisten dengan halaman lainnya.

## 2. Perbaikan Tampilan & Layout Preview Laporan (Kertas F4/A4)
- **Skala Otomatis & Responsif (Auto-Scaling):** Menerapkan kembali fungsi `adjustPreviewScale()` di dalam iframe laporan agar tampilan pratinjau kertas F4/A4 otomatis menyesuaikan skala zoom pada layar HP (mobile) maupun desktop tanpa merusak layout asli cetak.
- **Restorasi Fitur Edit Mode:** Mengembalikan fitur interaktif "Edit Mode" pada halaman preview laporan bulanan. Admin kini dapat menggeser margin konten ke atas/bawah, serta memperbesar, memperkecil, menggeser, atau menghapus tanda tangan langsung di halaman preview sebelum dicetak.
- **Konsistensi Font (Arial):** Memperbaiki bug font-serif bawaan browser dengan memaksakan penggunaan font `'Arial', sans-serif !important` pada seluruh elemen teks di preview laporan.
- **Kop Surat & Judul Overlap:** Memperbaiki masalah judul laporan yang menutupi kop surat dengan menyesuaikan jarak atas (`padding-top: 5.5cm`) sehingga judul tampil rapi tepat di bawah kop surat.
- **Garis Tabel (Borders):** Memperbaiki garis tabel yang sempat hilang/putih polos dengan menerapkan style border hitam pekat (`border: 1px solid #000 !important`) pada tag table, th, dan td.
- **Jarak Tanda Tangan (TTD):** Mengoreksi path file gambar tanda tangan ke `TTD Bendahara.webp` agar muncul dengan benar. Kami juga memberikan margin negatif (`-15px`) agar jarak kosong antara gambar tanda tangan dan nama bendahara tidak terlalu jauh/renggang.
- **Kerapian Nominal Rupiah (No Wrap):** Mencegah simbol mata uang `Rp` terpotong ke baris baru atau berada di atas angka nominal dengan menambahkan properti `white-space: nowrap !important` pada kolom Debit, Kredit, dan Saldo.

## 3. Penyempurnaan Format & Lokalisasi Data
- **Nama Bulan Bahasa Indonesia:** Mengubah format nama bulan dari angka (misal: "Bulan 06") menjadi nama bulan lengkap dalam Bahasa Indonesia (misal: "Bulan Juni") pada bagian judul laporan serta tanggal tanda tangan bendahara.
- **Format Tanggal Tabel Indonesia:** Mengubah format tanggal mentah `YYYY-MM-DD` dari database menjadi format Indonesia `DD/MM/YYYY` (contoh: 24/06/2026) baik di tabel utama halaman laporan maupun di preview laporan bulanan.

## 4. Perbaikan Logika Database & Perhitungan Saldo (Running Balance)
- **Urutan Kronologis Data:** Memperbaiki cara pengurutan data transaksi di database (`getLaporanPaginated` pada `TransaksiModel.js`) yang sebelumnya `ORDER BY id DESC` (terbalik/terbaru dahulu) menjadi `ORDER BY tanggal ASC, id ASC`. Dengan ini, aliran buku kas berjalan urut secara kronologis dari tanggal terawal hingga terakhir.
- **Baris "Saldo Bulan Kemarin":** Menambahkan baris dinamis "Saldo Bulan Kemarin" pada baris pertama tabel laporan (hanya muncul di halaman pertama saat filter bulan aktif) untuk menunjukkan saldo awal bulan berjalan yang dihitung dari akumulasi bersih transaksi bulan-bulan sebelumnya.
- **Akurasi Running Balance pada Pagination:** Memperbaiki perhitungan saldo berjalan saat berpindah halaman (page 2, page 3, dst.). Sistem sekarang menghitung saldo awal halaman berikutnya (`saldoAwal`) dengan benar menggunakan total akumulasi transaksi yang dilewati (`offset`), sehingga nilai "Saldo" di halaman lanjutan tetap berlanjut (kontinu) dari halaman sebelumnya.
