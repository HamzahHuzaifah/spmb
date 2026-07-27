#!/bin/bash

# 1. Masuk ke folder yang benar
cd /home/mjir4837/repositories/spmb

# 2. Tarik kode terbaru dari GitHub
git pull origin main

# 3. Masuk ke environment Node.js 22
source /home/mjir4837/nodevenv/repositories/spmb/22/bin/activate

# 4. Hapus node_modules asli agar CloudLinux bisa membuat symlink, lalu install
rm -rf node_modules
npm install --production

# 5. Bunuh proses hantu lama di port 5000 (khusus SPMB)
kill -9 $(lsof -t -i:5000) 2>/dev/null || true

# 6. Jalankan ulang di background
nohup node app.js > app.log 2>&1 & disown

echo "Server berhasil di-restart!"
