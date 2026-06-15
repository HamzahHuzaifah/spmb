# Dokumentasi Perbaikan & Penyesuaian Proyek (Fixing.md)

Dokumen ini berisi rangkuman seluruh perbaikan (*bug fixing*) dan penyesuaian fitur yang telah dilakukan sepanjang sesi pengembangan proyek. Dokumen ini berguna sebagai referensi jika masalah serupa muncul kembali di kemudian hari.

---

## 1. Perbaikan pada Halaman Cetak Kwitansi (`kwitansi.ejs` & `kwitansi.css`)

### A. Isu Posisi Nominal dan Terbilang
**Masalah:** Permintaan untuk menukar posisi "Nominal" (Rp) agar berada di bawah, dan "Terbilang" berada di atasnya pada halaman kwitansi. Sempat terjadi kendala di mana posisi tidak berubah meski CSS `order` pada flexbox telah disesuaikan.
**Solusi:**
- Menghapus ketergantungan visual menggunakan properti `order` dari CSS Flexbox yang bermasalah pada tag `<tbody>` dan `<tr>`.
- Menggunakan naskah fisik (`physical_swap.js`) untuk **menukar secara permanen susunan HTML** baris `terbilangRow` dan `nominalRow` pada berkas `kwitansi.ejs`.

### B. Isu Jarak/Gap Vertikal Terlalu Jauh Antar Baris (Bug Flexbox Tabel)
**Masalah:** Terdapat jarak kosong vertikal yang sangat jauh di dalam baris kwitansi (di atas/bawah Terbilang dan Nominal). *Margin* dan *padding* sudah dinolkan, tetapi jaraknya tetap ada.
**Solusi:**
- *Root cause*: `<tbody>` disetel menggunakan `display: flex; flex-direction: column;` di dalam elemen `<table>`. Hal ini memicu *browser* (layout engine tabel) membagi dan menarik rata sisa tinggi secara otomatis, sehingga baris menjadi "melar" (stretching).
- Mengubah `.content-table` menjadi `display: block;` di file `kwitansi.css` untuk menonaktifkan paksaan tinggi (height constraints) bawaan algoritma tabel HTML.

### C. Pemosisian Tombol Aksi (Sticky Sidebar)
**Masalah:** Tombol "Cetak Kwitansi", "Edit Data", "Export PDF", "Export Word", dsb berada berjejer mendatar di atas kertas, menyebabkan keseluruhan kertas tidak terpusat di layar.
**Solusi:**
- Merombak `body` menggunakan `display: flex; flex-direction: column; align-items: center;` agar kertas kuitansi berada tepat di tengah (*center*).
- Membuat kelas `.action-buttons` menjadi `position: fixed; top: 50%; right: 40px; transform: translateY(-50%);` dengan arah kolom (`flex-direction: column`). Tombol-tombol kini melayang (*floating*) rapi secara vertikal di bagian kanan layar tanpa menggeser kertas.

### D. CSS Caching Issue
**Masalah:** Perubahan file CSS tidak langsung terlihat di *browser* klien.
**Solusi:** Mengimplementasikan "Cache Busting" dengan menambahkan parameter versi pada referensi CSS (contoh: `/css/kwitansi.css?v=5`) untuk memaksa pemuatan ulang gaya.

---

## 2. Perbaikan pada Ekspor Dokumen
**Masalah:** Margin/Padding untuk format Export.
**Solusi:** Memastikan konfigurasi padding di `.content-overlay` pada template latar belakang sesuai (Padding disesuaikan pada `6.5cm 2.5cm 2.5cm 2.5cm`) agar teks kwitansi tidak menimpa kop surat yayasan.

---

## 3. Perbaikan Skala Besar Model Database (Backend / MySQL)

### Isu `undefined` pada Proses Edit Data
**Masalah:** Terjadi "Server Error" / aplikasi *crash* ketika menyimpan hasil edit form. Hal ini diakibatkan oleh data kosong yang dikirim *frontend* bernilai `undefined`, yang mana ditolak keras oleh sistem basis data MySQL.
**Solusi:**
- Melakukan pencegatan (intersepsi) data skala besar pada berkas pengelola basis data:
  - `SantriModel.js`
  - `TagihanModel.js`
  - `TunggakanModel.js`
  - `TransaksiModel.js`
- Menambahkan **Filter Keamanan Data** untuk melakukan konversi jika suatu parameter bernilai `undefined`, ia akan otomatis dikonversi menjadi `null` sebelum diteruskan untuk instruksi MySQL (contoh: `UPDATE ... SET x = ?`). Basis data aman dan tidak akan mendapati kesalahan sintaks/tipe data.

---

*Catatan: Dokumen ini akan dibaca oleh saya (AI Assistant) secara berkala agar saya tetap memahami konteks historis arsitektur proyek dan keputusan perbaikan struktur file yang telah kita lakukan.*
