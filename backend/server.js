const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();

// Set View Engine ke EJS
app.set('view engine', 'ejs');
// Arahkan folder views ke frontend/views
app.set('views', path.join(__dirname, '../frontend/views'));

const { sanitizeInput } = require('./middlewares/sanitizeInput');
const morgan = require('morgan');
const logger = require('./utils/logger');

// Middlewares
// Morgan Setup untuk mencatat semua Request HTTP melalui Winston
const morganFormat = process.env.NODE_ENV !== 'production' ? 'dev' : 'combined';
app.use(morgan(morganFormat, {
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // PENTING: Memungkinkan Express membaca cookie token login
// PENTING: Global Sanitizer! Semua input dari user (Admin & Public) akan dicuci di sini
app.use(sanitizeInput);

// Arahkan static assets ke frontend/public
app.use(express.static(path.join(__dirname, '../frontend/public')));

// ==========================================
// ROUTES
// ==========================================
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');

// Mount routes
// PENTING: publicRoutes harus ditaruh di atas adminRoutes
// Agar halaman publik (landing page) tidak ikut tertangkap oleh gembok admin
app.use('/', publicRoutes);
app.use('/', adminRoutes);

// Tambahkan Global Error Handler
app.use((err, req, res, next) => {
    // Log error secara otomatis dengan winston
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    res.status(err.status || 500);
    res.send('Terjadi Kesalahan Internal Server');
});

// Menjalankan Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Server berjalan di http://localhost:${PORT}`);
    console.log(`Server berjalan di http://localhost:${PORT}`);
});

// Cari baris port Anda, ubah menjadi seperti ini:
const PORT = process.env.PORT || 5000;

// Pastikan bagian listen menggunakan variabel PORT tersebut:
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
