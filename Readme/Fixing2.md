# Dokumentasi Perbaikan dan Pembaruan SPMB Web App (Bagian 2)

Berikut adalah ringkasan dari berbagai perbaikan tampilan (UI/UX) dan fungsionalitas yang telah kita kerjakan pada sesi ini:

## 1. Perbaikan Tampilan Filter Bar
- **Halaman Laporan Utama:** Telah dilakukan penyesuaian HTML dan CSS agar tampilan filter bar menjadi lebih rapi.
- **Konsistensi Halaman Lain:** Memperbaiki letak filter pada dimensi desktop di halaman-halaman lain yang sebelumnya menurun ke bawah (vertikal) agar menjadi menyamping (horizontal), sehingga seragam dengan gaya pada halaman laporan utama.
- **Input Tahun Manual:** Mengubah input tahun pada filter tab agar admin dapat mengetik/mengisi tahun secara manual. Hal ini memastikan web dapat digunakan hingga bertahun-tahun ke depan tanpa terbatas oleh dropdown pilihan tahun.

## 2. Perbaikan Fitur Preview Laporan
- **Responsivitas Mobile:** Memperbaiki tata letak pop-up preview laporan agar rapi dan responsif saat diakses menggunakan dimensi HP.
- **Validasi Wajib Filter:** Menambahkan sistem validasi di mana admin diwajibkan untuk memilih **Tahun** dan **Bulan** terlebih dahulu jika ingin membuka preview laporan.
- **Perbaikan Sinkronisasi Data:** Memperbaiki bug di mana data pada tabel Laporan Keuangan SPMB JIC sempat tidak muncul setelah tahun dan bulan dipilih. Saat ini, isi data pada preview laporan sudah dipastikan sesuai (sinkron) dengan data yang tampil pada tabel tersebut berdasarkan filter.

## 3. Peningkatan Pengalaman Pengguna (UX)
- **Custom Pop-up Notifikasi:** Mengganti pop-up alert/pemberitahuan bawaan browser (default Google/browser) menjadi pop-up custom buatan sendiri menggunakan HTML dan CSS aplikasi, sehingga terlihat lebih menyatu dan elegan.
- **Animasi Loading:** Menambahkan fitur animasi loading (loader) saat proses refresh atau pengambilan data, memberikan feedback visual kepada admin agar tahu web sedang bekerja (terutama saat internet atau server lambat).

## 4. Perbaikan Layout Dashboard & Tabel
- **Layout Card Dashboard (col-md):** Merapikan struktur HTML dan CSS pada kartu-kartu metrik di halaman dashboard. Memperbaiki masalah elemen yang berantakan atau persentase yang terpotong/tertutup ke arah kiri, sehingga sekarang sudah rapi di dimensi desktop maupun HP.
- **Tabel Informasi Pengeluaran:** Memperbaiki lebar tabel pada bagian "INFORMASI PENGELUARAN KEUANGAN SPMB" yang sebelumnya sering melebar ke samping (overflow) yang menyebabkan total pengeluaran tertutup.

## 5. Logika Perhitungan Dashboard (Sedang Dikerjakan)
- **Filter Tanggal Dashboard:** Sedang dilakukan investigasi dan perbaikan terhadap logika kalkulasi data di halaman dashboard. Ditemukan bug di mana jika filter diset ke tanggal kosong (contoh: 1 Januari - 2 Januari 2026), dashboard masih memunculkan data kalkulasi global (keseluruhan) bukan sesuai range tanggal tersebut. Fokus selanjutnya adalah menyempurnakan logic ini.
