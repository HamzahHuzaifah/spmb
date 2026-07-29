# Dokumentasi Perbaikan Deploy cPanel (SIKMA & SPMB)

Dokumen ini mencatat seluruh masalah *deployment* (tarik kode dan *restart* server) yang terjadi pada aplikasi SIKMA dan SPMB di cPanel, beserta solusi permanen yang telah diterapkan.

---

## 1. Masalah pada SIKMA

### A. Git Pull Gagal (Aborting)
- **Gejala:** Saat menjalankan `./restart-server.sh`, proses `git pull` gagal dengan pesan error `Aborting` karena ada file yang akan tertimpa (konflik).
- **Penyebab:** File `tmp/restart.txt` yang dibuat oleh script untuk memancing Passenger ternyata dianggap sebagai *untracked file* yang bentrok oleh Git.
- **Solusi Permanen:** Memasukkan `tmp/restart.txt` dan `app.log` ke dalam file `.gitignore` agar selalu diabaikan oleh Git.

### B. Kesalahan Pembunuhan Proses (Menyebabkan SPMB Mati)
- **Gejala:** Saat SIKMA di-restart, web SPMB malah ikut mati (Error 503).
- **Penyebab:** Script `restart-server.sh` SIKMA menggunakan perintah brutal `killall -9 node` yang menembak mati **semua** proses Node.js yang ada di server cPanel (termasuk SPMB).
- **Solusi Permanen:** Mengubah perintah kill di `restart-server.sh` SIKMA agar hanya membunuh proses miliknya sendiri secara spesifik berdasarkan nama file dan port:
  ```bash
  fuser -k 5001/tcp 2>/dev/null || true
  pkill -9 -f "node app.js" 2>/dev/null || true
  ```

---

## 2. Masalah pada SPMB

### A. Web SPMB Mati (Error 503 Service Unavailable)
- **Gejala:** Setelah SPMB terbunuh, web SPMB terus menampilkan Error 503 meskipun sudah ditekan tombol *Restart* berulang kali dari menu cPanel Node.js App.
- **Penyebab:** 
  1. Efek `kill -9` meninggalkan *socket zombie* di server web LiteSpeed.
  2. Adanya folder/file fisik bernama `node_modules` di dalam direktori `repositories/spmb`. Sistem Cloudlinux NodeJS Selector cPanel akan mendeteksi ini sebagai pelanggaran, karena ia mewajibkan `node_modules` berbentuk *symlink/shortcut* ke virtual environment cPanel. Ini memblokir SPMB untuk bisa *start*.
- **Solusi Permanen:**
  1. Menghapus folder/file `node_modules` fisik secara manual melalui File Manager.
  2. Melakukan trik "Pancingan Reset Socket" (mengubah Node.js version ke 20 -> Save, lalu ubah kembali ke 22 -> Save).
  3. Menekan tombol **Run NPM Install** di cPanel agar *symlink* resmi `node_modules` dibuat ulang oleh sistem.

### B. Tampilan Web SPMB Tidak Berubah (Kode Baru Tidak Ter-update)
- **Gejala:** Kode perubahan sudah di-*push* ke GitHub dan berhasil di-*pull*, tetapi saat di-*refresh*, web SPMB tetap menampilkan kode/tampilan lama.
- **Penyebab:** 
  1. Ternyata SPMB **juga menggunakan sistem Hybrid Proxy** di port 5000, namun script `restart-server.sh` lama tidak memiliki perintah untuk membunuh proses port 5000 dan tidak menyalakannya kembali dengan `nohup`.
  2. Akibatnya, server lama masih terus berjalan di memori (*zombie*) sambil memegang cache tampilan (EJS) lama, dan server baru gagal menyala karena port 5000 *error EADDRINUSE*.
  3. Git Pull sesekali ter-abort karena konflik `tmp/restart.txt`.
- **Solusi Permanen:**
  1. Menambahkan `.gitignore` di SPMB (sama seperti SIKMA).
  2. Merombak `restart-server.sh` SPMB dengan perintah pembunuh (kill) tingkat tinggi yang 100% mematikan server lama, diikuti perintah *background abadi* (`nohup`):
  ```bash
  # Bunuh proses SPMB yang lama (Anti Zombie)
  fuser -k 5000/tcp 2>/dev/null || true
  pkill -9 -f "node backend/server.js" 2>/dev/null || true
  ps ux | grep 'node backend/server.js' | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null || true

  # Jalankan SPMB secara abadi di background port 5000
  PORT=5000 nohup node backend/server.js > app.log 2>&1 & disown
  ```

---

## Kesimpulan
Kini, kedua aplikasi (SIKMA dan SPMB) telah sepenuhnya terisolasi dan mandiri. `restart-server.sh` masing-masing sudah pintar mendeteksi prosesnya sendiri tanpa mengganggu proses Node.js aplikasi lain di akun cPanel yang sama.
