module.exports = {
  apps: [{
    name: "spmb-web-app",
    script: "backend/server.js",
    watch: false,
    instances: "max", // Akan menggunakan semua core CPU yang tersedia (mencegah bottleneck)
    exec_mode: "cluster", // Menjalankan Node.js dalam mode cluster untuk load balancing
    autorestart: true, // Akan me-restart secara otomatis jika terjadi crash/error
    max_memory_restart: "1G", // Akan me-restart secara otomatis jika penggunaan memori > 1GB
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 5000,
    },
    log_date_format: "YYYY-MM-DD HH:mm Z",
    error_file: "logs/pm2-error.log",
    out_file: "logs/pm2-out.log",
    merge_logs: true
  }]
};
