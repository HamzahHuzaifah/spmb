const rateLimit = require('express-rate-limit');

// Batasan untuk pendaftaran (mencegah spam form / serangan DDoS ringan)
// Konfigurasi: Maksimal 50 submit dari 1 IP yang sama dalam waktu 15 menit (Dinaikkan sementara untuk keperluan testing)
const pendaftaranLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 50, // Batas maksimal request per IP (Default produksi disarankan 5)
    message: 'Terlalu banyak permintaan pendaftaran dari komputer ini. Silakan coba lagi setelah 15 menit.',
    standardHeaders: true, // Mengirim info rate limit di header (standar baru)
    legacyHeaders: false, // Mematikan header standar lama
});

// Jika suatu saat ada endpoint login, Anda bisa membuat limiter khusus login di sini
// const loginLimiter = rateLimit({ ... });

module.exports = {
    pendaftaranLimiter
};
