# Catatan Deployment & Solusi Masalah (Troubleshooting Log)
**Proyek:** SPMB Web App - Madrasah Jakarta Islamic Centre (MJIC)
**Domain:** `spmb.mjic.sch.id`

Dokumen ini disusun sebagai panduan resmi dan riwayat pemecahan masalah (troubleshooting) untuk deployment aplikasi Node.js SPMB di cPanel. Karena arsitektur server cPanel menggunakan sistem **Reverse Proxy** (mengarahkan domain langsung ke port internal `5000`), proses deployment memerlukan penanganan khusus.

---

## Bagian 1: Langkah-Langkah Deployment dari Awal (Manual)

Jika suatu saat Anda harus mendeploy ulang aplikasi ini dari nol, ikuti urutan langkah berikut:

### 1. Persiapan File Proyek
* Buat file `.zip` (misal: `spmb-deploy.zip`) di komputer lokal Anda.
* **PENTING:** Hanya kompres file-file utama saja. **JANGAN sertakan folder `node_modules`** agar ukuran file ZIP tetap kecil dan bersih. Pastikan file `package.json`, `app.js`, folder `backend`, dan folder `frontend` ikut terpilih secara langsung.

### 2. Upload & Ekstraksi di File Manager
* Masuk ke **File Manager cPanel**, lalu buka direktori utama aplikasi Anda (yaitu folder `/home/mjir4837/spmb/`).
* Upload file `.zip` Anda ke folder tersebut.
* Klik kanan file `.zip` lalu pilih **Extract**. 
* **PENTING:** Pastikan semua file terekstrak secara sejajar langsung di dalam folder `/spmb/` (seperti `app.js` dan `package.json` harus berada langsung di bawah folder `/spmb/`, bukan terkurung di dalam sub-folder seperti `/spmb/spmb-web-app/`).

### 3. Pembuatan Database & Hak Akses
1. Masuk ke menu **MySQL Databases** di cPanel.
2. Buat database baru (misal: `mjir4837_spmb_web_app`).
3. Buat user database baru (misal: `mjir4837_spmb_web_app`) dan catat password-nya.
4. **LANGKAH WAJIB:** Hubungkan user tersebut ke database di bagian menu **Add User To Database**. Centang pilihan **`ALL PRIVILEGES`** lalu klik **Make Changes**.

### 4. Konfigurasi File `.env`
* Di dalam folder `/spmb/` pada File Manager, buat file baru dengan nama **`.env`** (pakai tanda titik di depan).
* Edit file tersebut dan isi dengan konfigurasi database cPanel Anda:
  ```env
  PORT=5000
  NODE_ENV=production
  DB_HOST=127.0.0.1
  DB_USER=mjir4837_spmb_web_app
  DB_PASSWORD=Tulis_Password_MySQL_Anda_Di_Sini
  DB_NAME=mjir4837_spmb_web_app
  JWT_SECRET=KunciRahasiaSPMBmjic2024SangatKuat!
  ```

### 5. Import Skema Database
* Masuk ke menu **phpMyAdmin** di cPanel Anda.
* Pilih database `mjir4837_spmb_web_app` di kolom sebelah kiri.
* Klik tab **Import** di menu atas.
* Pilih file **`spmb_web_app.sql`** yang sudah diperbarui, lalu scroll ke bawah dan klik **Import/Kirim**.

### 6. Instalasi Dependencies (Library)
* Buka menu **Terminal** di cPanel Anda.
* Masuk ke virtual environment Node.js Anda (perintahnya tertulis di kotak biru halaman *Setup Node.js App* cPanel). Contoh:
  ```bash
  source /home/mjir4837/nodevenv/spmb/22/bin/activate && cd /home/mjir4837/spmb
  ```
* Jalankan perintah instalasi library:
  ```bash
  npm install
  ```

### 7. Jalankan Aplikasi di Latar Belakang (24 Jam Nonstop)
* Agar aplikasi tetap berjalan setelah Anda menutup terminal cPanel, gunakan perintah `nohup`:
  ```bash
  nohup node app.js > app.log 2>&1 &
  ```
* Untuk memastikan aplikasi telah berjalan sukses di latar belakang, jalankan perintah:
  ```bash
  ps aux | grep node
  ```
  *(Pastikan ada baris proses Node.js dengan nama `app.js` yang sedang aktif).*

---

## Bagian 2: Riwayat Masalah & Solusi (Troubleshooting Log)

Berikut adalah daftar masalah rumit yang terjadi selama deployment dan cara kami menyelesaikannya:

### Masalah 1: Tabel `admin` Tidak Ditemukan Setelah Import SQL
* **Gejala:** Menu login tidak bisa digunakan dan tabel `admin` tidak terbuat saat mengimpor file database.
* **Penyebab:** Berkas SQL bawaan proyek tidak memiliki skema pembuatan tabel `admin` beserta data admin default-nya.
* **Solusi:** Kami menambahkan perintah SQL berikut di bagian paling bawah berkas `spmb_web_app.sql` sebelum di-import ulang:
  ```sql
  CREATE TABLE IF NOT EXISTS admin (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      nama_lengkap VARCHAR(150) NOT NULL,
      password VARCHAR(255) NOT NULL
  );
  INSERT INTO admin (username, nama_lengkap, password) VALUES 
  ('admin', 'Administrator Sistem', '$2b$10$Iuf/rM43O0khRx5Tztg6BeTdlbsvQkCs5Hbk3cPd9gaWf6j.SMN0m');
  ```
  *Sandi default yang dihasilkan adalah `admin` dengan password `admin123` (di-enkripsi dengan aman).*

### Masalah 2: Tombol "Run NPM Install" Nonaktif / File `package.json` Tidak Ditemukan
* **Gejala:** cPanel menampilkan pesan *"package.json file is required"* dan melarang instalasi library.
* **Penyebab:** File hasil ekstraksi ZIP bersarang di dalam sub-folder `/spmb/spmb-web-app/...` sehingga tidak sejajar dengan lokasi deteksi root aplikasi cPanel.
* **Solusi:** Kami masuk ke sub-folder tersebut di File Manager, memblokir seluruh file menggunakan fitur **Select All**, lalu melakukan **Move** (pemindahan) ke direktori root utama `/spmb/`.

### Masalah 3: Error "Terjadi kesalahan sistem internal." Saat Tombol Login Ditekan (Access Denied)
* **Gejala:** Koneksi tes database sukses, tetapi halaman login membalas dengan pesan error internal sistem.
* **Penyebab:** 
  1. User database belum digabungkan ke database utama di cPanel dengan pilihan hak akses *ALL PRIVILEGES*.
  2. Adanya **Proses Hantu (Ghost Process)** Node.js lama yang masih menggantung di memory server sejak kemarin, sehingga server terus-menerus menjalankan memori lama yang belum terhubung ke database.
* **Solusi:** 
  1. Menghubungkan user database ke database di menu *MySQL Databases*.
  2. Lacak ID proses Node lama di Terminal menggunakan `ps aux | grep node` (ditemukan proses ID `1817630` dari tanggal *Jun28*).
  3. Matikan proses lama tersebut dengan perintah: `kill -9 1817630`.
  4. Jalankan ulang server agar memuat konfigurasi `.env` yang baru.

### Masalah 4: Aplikasi Mengalami Crash `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`
* **Gejala:** Aplikasi mendadak mati (503 Service Unavailable) tepat setelah tombol login diklik. Catatan log terminal (`app.log`) menunjukkan error *ValidationError* dari *express-rate-limit*.
* **Penyebab:** cPanel berjalan di balik *reverse proxy* yang meneruskan header `X-Forwarded-For` ke aplikasi Node.js. Karena keamanan bawaan rate-limiter sangat ketat, ia mematikan paksa aplikasi karena Express belum disetel untuk mempercayai proxy tersebut.
* **Solusi:** Menambahkan setelan *trust proxy* di baris paling atas konfigurasi Express pada file `backend/server.js`:
  ```javascript
  const app = express();
  // PENTING: Trust Proxy agar rate-limit bisa membaca IP asli di balik reverse proxy cPanel
  app.set('trust proxy', 1);
  ```

### Masalah 5: Gagal Login Tanpa Pesan Error (Halaman Ter-refresh Kosong)
* **Gejala:** Pendaftaran santri baru berhasil masuk database phpMyAdmin, tetapi tombol login admin hanya merefresh halaman kembali kosong tanpa memunculkan pesan kesalahan apa pun.
* **Penyebab:** Pengunjung mengakses web menggunakan protokol tidak aman HTTP (`http://spmb.mjic.sch.id`), sementara cookie token login admin disetel dengan atribut `secure: true` (hanya bisa dikirim melalui HTTPS). Akibatnya, browser menolak menyimpan token login tersebut.
* **Solusi:** Akses alamat web menggunakan protokol HTTPS yang aman:
  👉 **`https://spmb.mjic.sch.id/login`**
  *(Dengan HTTPS, cookie tersimpan sempurna di browser, otentikasi login berjalan lancar, dan dashboard admin berhasil terbuka).*

### Masalah 6: Perubahan File Kode/Tampilan Tidak Berubah Meskipun Aplikasi Sudah Direstart di cPanel
* **Gejala:** File EJS, HTML, CSS, atau logika JavaScript backend sudah diedit langsung di cPanel File Manager, tetapi setelah menekan tombol "Restart" pada menu *Setup Node.js App* cPanel, tampilan/fitur di website tetap tidak berubah (menggunakan kode versi lama).
* **Penyebab:** Aplikasi berjalan di latar belakang (*background process*) secara mandiri menggunakan `nohup` (sesuai langkah deployment). Menu *Setup Node.js App* cPanel tidak dapat mendeteksi atau mematikan proses `nohup` ini. Akibatnya, proses lama tetap berjalan di memori (*Ghost Process*) dan terus melayani pengunjung menggunakan salinan kode yang lama.
* **Solusi:**
  1. Masuk ke **Terminal cPanel**.
  2. Lacak ID proses (PID) Node.js yang sedang berjalan menggunakan perintah:
     ```bash
     ps aux | grep node
     ```
  3. Cari baris yang menjalankan `node app.js` (biasanya jalurnya ke `/opt/alt/alt-nodejs22/.../node app.js`), lalu catat nomor PID-nya (kolom kedua).
  4. Matikan paksa proses lama tersebut:
     ```bash
     kill -9 <NOMOR_PID>
     ```
  5. Aktifkan kembali environment Node.js dan jalankan aplikasinya menggunakan perintah:
     ```bash
     source /home/mjir4837/nodevenv/spmb/22/bin/activate && cd /home/mjir4837/spmb
     nohup node app.js > app.log 2>&1 &
     ```
  6. Terakhir, lakukan **hard-refresh** pada browser Anda (tekan `Ctrl + F5` atau gunakan mode Incognito) agar browser memuat aset baru dari server.

