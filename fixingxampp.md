# Panduan Mengatasi Error MySQL XAMPP (Crash/Corrupt)

Dokumen ini berisi catatan perbaikan untuk masalah **XAMPP MySQL** yang menyebabkan aplikasi Node.js mengalami error `connect ETIMEDOUT`.

## Gejala Error
- Aplikasi Node.js tidak bisa terhubung ke database dan memunculkan error `Error: connect ETIMEDOUT` di terminal.
- Saat mencoba menjalankan perintah `mysql` melalui Command Prompt, command akan *hang* (macet) tanpa memberikan output.
- Log error MySQL (`C:\xampp\mysql\data\mysql_error.log`) menunjukkan:
  - `log sequence number is in the future` (InnoDB log tidak sinkron).
  - `Table '.\mysql\db' is marked as crashed and last (automatic?) repair failed` (Tabel sistem Aria corrupt).

## Penyebab
Masalah ini umumnya terjadi akibat laptop/server mati mendadak (mati lampu, *blue screen*, atau kehabisan baterai) atau karena aplikasi XAMPP ditutup paksa. Hal tersebut menyebabkan file log InnoDB gagal ditulis dengan sempurna dan tabel internal MariaDB menjadi rusak (*corrupt*).

---

## Langkah-Langkah Perbaikan (Troubleshooting)

Berikut adalah langkah-langkah yang dilakukan untuk memperbaiki masalah ini:

### 1. Hentikan Paksa Proses MySQL yang Macet
Jika XAMPP Control Panel tidak bisa menghentikan MySQL (karena macet), gunakan PowerShell (Run as Administrator) untuk mematikan proses `mysqld.exe`:
```powershell
Stop-Process -Name mysqld -Force
```

### 2. Hapus File Log InnoDB yang Rusak
Arahkan ke folder data MySQL (biasanya di `C:\xampp\mysql\data`) dan hapus file log InnoDB lama agar sistem membuatnya ulang secara otomatis.
Hapus file berikut:
- `ib_logfile0`
- `ib_logfile1`
*(Catatan: Pastikan untuk TIDAK menghapus file `ibdata1` karena itu berisi data tabel Anda).*

### 3. Perbaiki Tabel Sistem Aria yang Corrupt
Karena MariaDB XAMPP menggunakan engine *Aria* untuk tabel bawaan sistem (`mysql.db`), tabel yang rusak bisa diperbaiki menggunakan *tool* `aria_chk`. Buka PowerShell dan jalankan:
```powershell
c:\xampp\mysql\bin\aria_chk.exe -r -o -f c:\xampp\mysql\data\mysql\*.MAI
```
*(Parameter `-r` untuk recover, `-o` untuk safe-recover, dan `-f` untuk force repair).*

### 4. Nyalakan Kembali MySQL
Setelah tabel diperbaiki, jalankan ulang layanan MySQL melalui XAMPP Control Panel, atau melalui perintah:
```powershell
Start-Process "c:\xampp\mysql\bin\mysqld.exe" -ArgumentList "--defaults-file=c:\xampp\mysql\bin\my.ini", "--standalone" -WindowStyle Hidden
```

### 5. Verifikasi dan Restart Aplikasi
Pastikan MySQL sudah berjalan dengan mencoba mengakses *phpMyAdmin* atau mengetikkan `mysql -u root` di terminal. 
Jika sudah berhasil terkoneksi, kembali ke terminal Node.js Anda yang sedang menjalankan `nodemon`, ketik `rs` lalu tekan **Enter** untuk menghubungkan ulang aplikasi ke database.
