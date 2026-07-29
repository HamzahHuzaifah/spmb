#!/bin/bash
echo "=== Memulai Update & Restart SPMB App ==="

# 1. Masuk ke folder repositories SPMB
cd /home/mjir4837/repositories/spmb || exit

# 2. Masuk ke Virtual Environment Node.js
source /home/mjir4837/nodevenv/repositories/spmb/22/bin/activate

# 3. Paksa bersihkan file lokal yang konflik lalu tarik kode terbaru dari GitHub
echo "[1/4] Menarik kode terbaru dari GitHub..."
git reset --hard origin/main
git pull origin main

# 4. Install dependencies jika ada paket baru
echo "[2/4] Memeriksa & menginstall dependencies..."
npm install --production

# 5. Cari dan matikan proses Node.js SPMB lama hanya di port 5000
echo "[3/4] Mematikan proses SPMB di port 5000..."
fuser -k 5000/tcp 2>/dev/null || kill -9 $(lsof -t -i:5000) 2>/dev/null || true

# 6. Jalankan ulang server di background dengan disown (Untuk standalone)
echo "[4/4] Menyalakan server SPMB di port 5000..."
nohup node app.js > app.log 2>&1 & disown

# 7. Restart via Passenger (Untuk cPanel)
mkdir -p tmp
touch tmp/restart.txt
echo "=== SUCCESS: Server SPMB berhasil di-restart! ==="
