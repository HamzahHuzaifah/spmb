# Catatan Pekerjaan - Hari Ini

## 1. Penambahan Fitur Card Tunggakan per Unit
- **Deskripsi:** Menambahkan 3 card baru di halaman Dashboard untuk menampilkan data tunggakan secara spesifik per unit, yaitu:
  - Tunggakan PAUDQu
  - Tunggakan TPQ
  - Tunggakan MDT
- **Lokasi File:** 
  - `frontend/views/dashboard.ejs` (Menyisipkan stat-card untuk masing-masing unit di bawah baris statistik utama).
- **Status:** Selesai dan sudah di-push ke branch `main`.

## 2. Perbaikan Isu Deployment / Update di cPanel (Git Pull Conflict)
- **Masalah:** Saat menjalankan script `./restart-server.sh` di cPanel, update terhenti (aborted) karena ada error *local changes to the following files would be overwritten by merge: restart-server.sh*. Ini membuat tampilan dashboard di cPanel tidak berubah karena kode terbarunya gagal ditarik dari GitHub.
- **Solusi:** 
  - Mengubah script `restart-server.sh` dengan menambahkan perintah `git reset --hard origin/main` tepat sebelum `git pull origin main`. 
  - **Fungsi:** Untuk secara otomatis menghapus/mengabaikan perubahan lokal di server cPanel yang bikin konflik, lalu memaksa server agar menyamakan kodenya persis dengan yang ada di GitHub.
- **Lokasi File:**
  - `restart-server.sh`
- **Status:** Selesai dan sudah di-push. Sekarang cPanel bisa dengan lancar melakukan pull kode terbaru tanpa macet lagi.
