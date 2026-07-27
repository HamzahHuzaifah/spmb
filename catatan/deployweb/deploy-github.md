# Panduan Autodeploy: GitHub to cPanel (CI/CD Otomatis)

Dokumen ini menjelaskan cara mengatur **Autodeploy (CI/CD)** agar setiap kali Anda melakukan `git push` ke GitHub, kode di cPanel akan langsung ter-update secara otomatis dan server akan memuat ulang (*restart*) tanpa perlu mengunggah file ZIP secara manual.

Kami menyajikan **2 Metode** yang paling umum digunakan untuk server cPanel. Anda dapat memilih metode yang paling sesuai dengan fasilitas hosting Anda.

---

## METODE 1: Menggunakan GitHub Actions & SSH (Sangat Direkomendasikan 🌟)

Metode ini menggunakan fitur bawaan GitHub Actions untuk masuk ke cPanel via SSH, menarik kode terbaru dari GitHub, menginstal dependencies, dan mematikan proses Node.js lama agar proses baru berjalan otomatis.

### Langkah 1: Pastikan Akses SSH Aktif di cPanel
1. Masuk ke **cPanel** Anda.
2. Cari menu **SSH Access**.
3. Pastikan statusnya aktif. Jika belum aktif, hubungi penyedia hosting Anda untuk mengaktifkan akses SSH (biasanya gratis).
4. Catat informasi berikut:
   * **SSH Host:** (Biasanya alamat IP server cPanel atau domain Anda, misal `spmb.mjic.sch.id`)
   * **SSH Port:** (Default cPanel biasanya `22`, tetapi beberapa provider menggunakan port khusus seperti `2222` atau `65002`)
   * **SSH Username:** Username cPanel Anda (yaitu `mjir4837`)

### Langkah 2: Buat SSH Key di cPanel
1. Di menu **SSH Access** cPanel, klik **Manage SSH Keys**.
2. Klik **Generate a New Key**.
3. Isi password (kosongkan juga bisa/opsional) lalu klik **Generate Key**.
4. Kembali ke halaman kunci, klik **Authorize** pada kunci privat/publik yang baru dibuat agar server memperbolehkan koneksi luar.
5. Klik **View/Download** pada bagian **Private Key**, lalu salin seluruh isi teks kunci tersebut (dimulai dari `-----BEGIN OPENSSH PRIVATE KEY-----` sampai selesai).

### Langkah 3: Simpan Kunci & Kredensial di Secrets GitHub
1. Buka repositori proyek Anda di **GitHub**.
2. Buka tab **Settings** -> **Secrets and variables** -> **Actions**.
3. Klik **New repository secret** dan tambahkan secret berikut satu per satu:
   * `SSH_HOST`: Isi dengan domain atau IP cPanel Anda (contoh: `spmb.mjic.sch.id`).
   * `SSH_USERNAME`: Isi dengan username cPanel Anda (`mjir4837`).
   * `SSH_KEY`: Tempel seluruh teks **Private Key** yang Anda salin dari cPanel di Langkah 2.
   * `SSH_PORT`: Isi dengan nomor port SSH cPanel Anda (contoh: `22`).

### Langkah 4: Buat File Workflow GitHub Actions
Di komputer lokal Anda, buat folder dan file baru di root proyek dengan struktur berikut:
📂 `.github/workflows/deploy.yml`

Tulis kode konfigurasi berikut ke dalam file `deploy.yml`:

```yaml
name: Deploy to cPanel

on:
  push:
    branches:
      - main  # Ganti dengan branch utama Anda (master/main)

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout Code
      uses: actions/checkout@v3

    - name: Executing remote ssh commands to deploy
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SSH_HOST }}
        username: ${{ secrets.SSH_USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        port: ${{ secrets.SSH_PORT }}
        script: |
          # 1. Masuk ke folder proyek cPanel
          cd /home/mjir4837/spmb
          
          # 2. Tarik kode terbaru dari GitHub
          git pull origin main
          
          # 3. Masuk ke virtualenv Node.js cPanel & Install Dependencies
          source /home/mjir4837/nodevenv/spmb/22/bin/activate
          npm install --production
          
          # 4. Cari PID proses Node.js hantu yang sedang berjalan dan matikan
          PID=$(ps aux | grep "node app.js" | grep -v grep | awk '{print $2}')
          if [ ! -z "$PID" ]; then
            echo "Mematikan proses Node.js lama dengan PID: $PID"
            kill -9 $PID
          fi
          
          # 5. Jalankan kembali aplikasi Node.js menggunakan nohup di background
          nohup node app.js > app.log 2>&1 &
          echo "Aplikasi Node.js berhasil dimulai ulang di latar belakang."
```

### Langkah 5: Hubungkan cPanel dengan Repositori GitHub Anda (Sekali Saja)
Agar perintah `git pull` di dalam cPanel berjalan tanpa meminta password:
1. Masuk ke Terminal cPanel.
2. Jalankan perintah `git remote -v`. Pastikan remote URL mengarah ke link SSH GitHub Anda (misal `git@github.com:username/repository.git`), bukan HTTPS.
3. Jika masih berupa HTTPS, ubah ke SSH menggunakan perintah:
   ```bash
   git remote set-url origin git@github.com:username/repository.git
   ```
4. Tambahkan SSH Public Key cPanel Anda ke bagian **Deploy Keys** di repositori GitHub Anda dengan akses read-only agar server cPanel bisa melakukan clone/pull.

---

## METODE 2: Menggunakan Git™ Version Control cPanel & Webhook

Jika provider hosting Anda membatasi akses SSH ke luar, Anda bisa memanfaatkan fitur Git bawaan cPanel untuk menarik kode dari GitHub secara otomatis melalui Webhook.

### Langkah 1: Daftarkan Deploy Key di GitHub
1. Masuk ke **cPanel** -> **Git™ Version Control**.
2. Di bagian atas, klik **SSH Access** lalu buat/salin **Public Key** cPanel Anda.
3. Buka GitHub repositori Anda, masuk ke **Settings** -> **Deploy keys** -> **Add deploy key**.
4. Tempel Public Key tersebut dan beri nama (misal: "cPanel Key"). Klik **Add key**.

### Langkah 2: Buat Repositori di cPanel
1. Kembali ke **Git™ Version Control** di cPanel.
2. Klik **Create**.
3. Nonaktifkan opsi *Clone a Repository* jika ingin membuat repositori kosong, atau aktifkan jika ingin meng-clone dari GitHub menggunakan alamat SSH (`git@github.com:...`).
4. Isi **Repository Path** (misal: `/home/mjir4837/spmb`).
5. Klik **Create**.

### Langkah 3: Konfigurasi File `.cpanel.yml`
Buat file bernama `.cpanel.yml` di root repositori proyek Anda agar cPanel tahu apa yang harus dilakukan setelah menarik kode:

```yaml
---
deployment:
  tasks:
    - export PATH=/bin:/usr/bin:/usr/local/bin
    # Salin file ke direktori target (jika folder repositori terpisah dari folder running)
    - /bin/rsync -av --exclude='.git' --exclude='node_modules' --exclude='.env' ./ /home/mjir4837/spmb/
    # Jalankan script bash untuk instalasi npm & restart background process
    - /bin/bash /home/mjir4837/spmb/restart-server.sh
```

### Langkah 4: Buat Script Auto-Restart di Server
Karena cPanel Git Control hanya menyalin file, kita harus membuat script bash (`restart-server.sh`) di dalam folder `/home/mjir4837/spmb/` untuk menangani instalasi library dan mematikan proses hantu:

```bash
#!/bin/bash
cd /home/mjir4837/spmb
source /home/mjir4837/nodevenv/spmb/22/bin/activate
npm install --production

# Cari dan bunuh PID proses lama
PID=$(ps aux | grep "node app.js" | grep -v grep | awk '{print $2}')
if [ ! -z "$PID" ]; then
    kill -9 $PID
fi

# Jalankan ulang
nohup node app.js > app.log 2>&1 &
```
*Pastikan Anda memberikan hak akses eksekusi ke file ini via Terminal cPanel:*
`chmod +x /home/mjir4837/spmb/restart-server.sh`

### Langkah 5: Buat File Webhook PHP (Pemicu Otomatis)
Karena cPanel tidak menyediakan URL webhook penarik otomatis secara langsung, kita membuat file `deploy-webhook.php` di folder publik Anda (misalnya di folder aset publik yang dapat diakses dari browser):

```php
<?php
// deploy-webhook.php
// Masukkan path repositori cPanel Anda
$repo_path = '/home/mjir4837/spmb';

// Jalankan git pull dan pemicu deployment cPanel
shell_exec("cd {$repo_path} && git pull origin main 2>&1");
shell_exec("echo 'Deployment triggered' >> {$repo_path}/deploy.log");

echo "Deployment completed!";
```
Daftarkan URL file PHP ini (misal `https://spmb.mjic.sch.id/deploy-webhook.php` atau sejenisnya) ke bagian **Webhooks** di halaman GitHub Anda. Setiap kali push, GitHub akan memanggil URL ini dan cPanel akan melakukan `git pull` secara otomatis.
