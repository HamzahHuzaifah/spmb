# Panduan Update Aplikasi ke Server cPanel

Berikut adalah langkah-langkah yang perlu Anda lakukan ketika ada perubahan baru pada kode di komputer Anda (Lokal) dan Anda ingin menaikkannya ke website yang online (cPanel).

## Langkah 1: Push Kode dari Komputer (Lokal) ke GitHub
Setiap kali selesai mengubah kode, lakukan 3 langkah ini di Terminal komputer Anda (VS Code):
1. Ketik: `git add .` (Memilih semua file yang berubah)
2. Ketik: `git commit -m "Pesan perubahan Anda"` (Menyimpan perubahan)
3. Ketik: `git push origin main` (Mengirimkan perubahan ke GitHub)

## Langkah 2: Masuk ke Terminal cPanel
1. Buka akun **cPanel** Anda di browser.
2. Cari dan klik menu **Terminal** (biasanya berada di bawah bagian *Advanced*).

## Langkah 3: Eksekusi Skrip Restart Server
Kita sudah membuat *script ajaib* bernama `restart-server.sh` di dalam folder project Anda di cPanel. Script ini akan masuk ke *virtual environment* Node.js secara otomatis, menarik kode terbaru dari GitHub (`git pull`), menginstal modul baru jika ada, dan merestart server aplikasi Anda.

Di dalam Terminal cPanel Anda, cukup ketikkan perintah pendek ini:
```bash
./restart-server.sh
```

**⚠️ Catatan Peringatan Normal:**
Setelah mengeksekusi script tersebut, jika Anda melihat pesan panjang bahasa Inggris yang dimulai dengan:
> *"Cloudlinux NodeJS Selector demands to store node modules for application in separate folder..."*

**Abaikan saja!** Itu adalah pesan peringatan normal dari sistem cPanel (CloudLinux) dan bukan sebuah *error*.

Selama Anda melihat pesan: 
**"Server berhasil di-restart!"**
Di baris paling bawah terminal, berarti website live Anda sudah sukses menggunakan versi kode yang paling baru!
