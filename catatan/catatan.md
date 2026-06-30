# Catatan Langkah Deploy Web via cPanel & GitHub Actions

Dokumen ini berisi rangkuman langkah demi langkah yang harus Anda lakukan untuk mengatur deployment otomatis dari GitHub ke cPanel.

---

## 📋 DAFTAR CHECKLIST DEPLOYMENT

### Langkah 1: Siapkan SSH Key di cPanel
1. Masuk ke **cPanel** -> menu **SSH Access** -> klik **Manage SSH Keys**.
2. Klik **Generate a New Key** (buat kunci baru).
3. Setelah dibuat, kembali ke halaman daftar kunci.
4. **PENTING:** Cari kunci yang baru dibuat pada tabel, lalu klik **Authorize** agar kunci tersebut aktif dan diizinkan terhubung.
5. Klik **View/Download** pada bagian **Private Key** (Kunci Privat), lalu salin seluruh isi teks kunci tersebut.
6. Klik **View/Download** pada bagian **Public Key** (Kunci Publik), lalu salin isi teks kuncinya yang diawali kata `ssh-rsa ...`.

---

### Langkah 2: Daftarkan Secrets di Repositori GitHub
Masuk ke repositori **GitHub** Anda di browser, lalu buka **Settings** -> **Secrets and variables** -> **Actions** -> klik **New repository secret** untuk menambahkan 4 data berikut satu per satu:

1. **`SSH_HOST`**
   * **Value:** Isi dengan domain Anda (contoh: `spmb.mjic.sch.id`)
2. **`SSH_USERNAME`**
   * **Value:** Isi dengan username cPanel Anda (`mjir4837`)
3. **`SSH_KEY`**
   * **Value:** Tempelkan seluruh isi **Private Key** yang Anda salin dari cPanel (Langkah 1 poin 5).
4. **`SSH_PORT`**
   * **Value:** Isi dengan port SSH cPanel Anda (biasanya `22`).

---

### Langkah 3: Daftarkan Deploy Key di GitHub
Agar cPanel diizinkan menarik (`git pull`) kode dari GitHub tanpa dimintai password:
1. Di halaman repositori **GitHub** Anda, masuk ke **Settings** -> **Deploy keys** -> **Add deploy key**.
2. **Title:** Beri nama bebas (contoh: `Kunci cPanel`).
3. **Key:** Tempelkan **Public Key** cPanel Anda yang diawali tulisan `ssh-rsa ...` (Langkah 1 poin 6).
4. *Biarkan opsi "Allow write access" tetap kosong/tidak dicentang.*
5. Klik **Add key**.

---

### Langkah 4: Hubungkan Repositori di Terminal cPanel
1. Buka menu **Terminal** di cPanel Anda.
2. Masuk ke folder proyek Anda:
   ```bash
   cd /home/mjir4837/spmb
   ```
3. Ubah URL remote Git agar mengarah ke alamat SSH GitHub (bukan HTTPS):
   ```bash
   git remote set-url origin git@github.com:HamzahHuzaifah/spmb.git
   ```
4. Tes apakah cPanel sudah bisa terhubung ke GitHub dengan sukses:
   ```bash
   ssh -T git@github.com
   ```
   *Jika muncul pertanyaan: `Are you sure you want to continue connecting (yes/no)?`, ketik **yes** lalu tekan Enter.*
   *Pastikan muncul pesan sukses seperti: `Hi HamzahHuzaifah/spmb! You've successfully authenticated...`*

---

### Langkah 5: Push Konfigurasi GitHub Actions dari Lokal (Komputer Anda)
Pastikan berkas `.github/workflows/deploy.yml` sudah ada di komputer lokal Anda, lalu jalankan perintah berikut di Terminal VS Code komputer lokal Anda untuk mengirimkannya ke GitHub:

```bash
git add .
git commit -m "Configure GitHub Actions deployment"
git push origin main
```

---

### Langkah 6: Pantau Proses Deploy Otomatis
1. Buka repositori **GitHub** Anda di browser.
2. Masuk ke tab **Actions**.
3. Di situ Anda akan melihat proses deploy sedang berjalan (ditandai dengan indikator berputar berwarna kuning, lalu berubah menjadi centang hijau jika sukses).
4. Jika centang hijau sudah muncul, kode baru Anda telah berhasil ditarik ke cPanel dan aplikasi Node.js Anda akan otomatis dimuat ulang (*restart*)!
