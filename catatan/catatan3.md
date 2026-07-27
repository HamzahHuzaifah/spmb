# Catatan Progres 3: Pencegahan Duplikasi Data & Perbaikan Filter/Paginasi Admin

## 1. Sistem Pencegahan Data Ganda (Fuzzy Matching)
- **Logika Validasi Pendaftaran**: Diimplementasikan algoritma **Levenshtein Distance** pada `SantriModel.js` untuk mengecek tingkat kemiripan data (Nama Santri, Tanggal Lahir, Nama Ayah).
- **Aturan Pendaftaran**:
  - Jika data memiliki kemiripan 100% (sama persis), formulir pendaftaran ditolak.
  - Jika terdapat manipulasi kecil (misal: ganti tanggal lahir namun nama mirip >= 85%), sistem akan menolak formulir dan meminta wali murid menghubungi admin.
  - Jika anak kembar (tanggal lahir sama, nama mirip >= 85%), sistem tetap mengizinkan.
- Hal ini mencegah wali murid melakukan pendaftaran ganda (double-entry) dengan mengakali data. Alur edit mandiri oleh wali murid ditiadakan untuk menjaga keamanan data.

## 2. Highlighting Duplikasi Data di Panel Admin
- **Visualisasi Tabel**: Admin kini dapat dengan mudah menemukan potensi duplikasi data.
- **Implementasi**: 
  - Fungsi `checkHasDuplicate` ditambahkan ke dalam `SantriModel.js` dan dipanggil di `santriController.js`.
  - Pada halaman **Data Santri Baru** dan **Data Santri Daftar Ulang**, baris tabel yang terdeteksi sebagai duplikat (tingkat kemiripan tinggi) diberi latar belakang merah muda (`#fee2e2`) dan lencana (badge) merah bertuliskan **Duplikat** di samping nama santri.

## 3. Client-Side Pagination & Perbaikan Filter Kolom
- **Masalah Awal**: Filter kolom dinamis (Spreadsheet-like Dropdown) hanya mampu memindai dan menyaring 10 data yang sedang tampil pada halaman aktif karena batasan *server-side pagination*.
- **Solusi**:
  - **Backend**: Batasan `limit` diubah menjadi `1000000` (sangat besar) dengan `offset = 0` pada seluruh controller halaman utama (Santri, Tagihan, Tunggakan, Transaksi, Laporan, Dashboard) agar seluruh data dikirim dari server ke browser. Hal ini mematikan paginasi *server-side* bawaan EJS.
  - **Frontend (`global.js`)**: Membangun sistem paginasi murni di *client-side*. Data yang ribuan tetap akan dipotong per halaman (10 baris) oleh JavaScript dengan nomor halaman interaktif. 
  - **Integrasi**: Filter dropdown kini bisa mendeteksi opsi unik dari *seluruh* isi database. Saat memfilter data, navigasi halaman (*client-side pagination*) akan beradaptasi secara dinamis sesuai sisa jumlah baris yang cocok dengan kriteria saringan.

## 4. Pemisahan Kode CSS (Modularity)
- **Refactoring**: Styling *dropdown filter* dan elemen UI interaktif lainnya yang sebelumnya diletakkan berantakan (sebagai *string injection*) di dalam `global.js` telah dihapus.
- **Lokasi Baru**: Kode CSS dipindahkan sepenuhnya ke berkas master `style.css`.
- **Manfaat**: Memisahkan logika aplikasi (JS) dari tampilan visual (CSS) membuat file menjadi lebih terstruktur, mudah dipelihara, dan mengikuti standar *best-practices*.
