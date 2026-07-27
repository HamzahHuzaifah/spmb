# Catatan Pengembangan Dashboard (Sesi 2)

Berikut adalah ringkasan fitur-fitur dan perbaikan yang telah kita kerjakan pada halaman Dashboard hari ini:

## 1. Pembuatan Grafik Baru (Visualisasi Data)
- **Grafik Garis (Line Chart):** Menambahkan tren pemasukan per bulan selama 1 tahun (Januari - Desember) menggunakan desain area berwarna biru.
- **Grafik Batang Horizontal (Bar Chart):** Menambahkan grafik rincian pengeluaran berdasarkan "Kategori Dana", sehingga memudahkan pelacakan pengeluaran operasional.
- **Grafik Lingkaran (Pie Chart) - Status Jalur Pendaftaran:** 
  - Memisahkan status jalur pendaftaran (Reguler, Beasiswa Dhuafa, dll) menjadi dua grafik berdampingan: **Santri Baru** dan **Daftar Ulang**.
  - Menggunakan variasi warna seragam agar mudah dipahami proporsinya.

## 2. Penyempurnaan Tampilan (UI & UX)
- **Responsive Horizontal Scroll:** 
  - Memperbaiki tampilan tabel dan kartu ringkasan di perangkat seluler (HP) yang sebelumnya teksnya bertumpuk dan terpotong. 
  - Sekarang tabel Keuangan (Finance Card), Pengeluaran, dan Ziswaf dapat digeser ke samping (scroll horizontal).
  - Menerapkan fitur geser horizontal yang sama pada grafik Bar/Line agar grafik tersebut tidak memudar dan menyusut secara ekstrem ketika dibuka di HP.
- **Penyempurnaan Label Grafik:** Menyesuaikan label angka pada sumbu grafik agar menampilkan satuan Juta (Jt), Ribu (Rb), dan Miliar (M) secara otomatis (Disingkat) dengan format Rupiah.
- **Kustomisasi Donat (Doughnut Chart):** Menambahkan teks tebal berwarna hijau yang menampilkan persentase Realisasi Bayar secara otomatis (misal: 57.5%) dan tulisan "Tercapai" tepat di tengah lubang grafik Realisasi vs Tunggakan.

## 3. Sinkronisasi Data Lanjutan
- Memperbaiki ketidaksinkronan data antara "Kartu Ringkasan Pendapatan" (di bagian atas) dengan grafik "Persentase Realisasi VS Tunggakan". Grafik sekarang telah disetel untuk mengambil data global secara keseluruhan (termasuk pemasukan bebas/Ziswaf) agar hasilnya 100% akurat dan persis dengan target.
