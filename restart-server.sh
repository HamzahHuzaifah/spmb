#!/bin/bash
echo "=== Memulai Update & Restart SPMB App ==="

# 1. Masuk ke folder repositories SPMB
cd /home/mjir4837/repositories/spmb || exit

# 2. Paksa bersihkan file lokal yang konflik lalu tarik kode terbaru dari GitHub
echo "[1/2] Menarik kode terbaru dari GitHub..."
git reset --hard origin/main
git pull origin main

# 3. Merestart server via Port 5000 (Sistem Hybrid Proxy)
echo "[2/2] Merestart server via Port 5000..."

# Matikan secara spesifik proses SPMB di port 5000 (jangan sentuh SIKMA)
fuser -k 5000/tcp 2>/dev/null || true
pkill -9 -f "node backend/server.js" 2>/dev/null || true
ps ux | grep 'node backend/server.js' | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null || true

# Jalankan SPMB secara abadi di background
PORT=5000 nohup node backend/server.js > app.log 2>&1 & disown

# Touch restart.txt formalitas
mkdir -p tmp
touch tmp/restart.txt

echo "=== SUCCESS: Server SPMB berhasil di-restart secara otomatis & aman! ==="
