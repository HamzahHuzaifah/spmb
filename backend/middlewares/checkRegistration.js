const db = require('../config/db');

exports.checkRegistrationOpen = async (req, res, next) => {
    try {
        // Tentukan kolom mana yang harus di cek berdasarkan route
        let columnToCheck = 'buka_pendaftaran_baru'; // default
        if (req.path.includes('beasiswa')) {
            columnToCheck = 'buka_pendaftaran_beasiswa';
        } else if (req.path.includes('daftar-ulang')) {
            columnToCheck = 'buka_daftar_ulang';
        }
        
        // Cek gelombang yang statusnya 'Aktif', tanggal hari ini ada di dalam rentangnya,
        // DAN konfigurasi spesifik form-nya sedang Aktif (1)
        const [rows] = await db.execute(
            `SELECT * FROM master_gelombang 
             WHERE status = 'Aktif' 
             AND tanggal_mulai <= CURDATE() 
             AND tanggal_selesai >= CURDATE() 
             AND ${columnToCheck} = 1
             LIMIT 1`
        );

        if (rows.length > 0) {
            // Pendaftaran Buka
            return next();
        } else {
            // Pendaftaran Tutup, arahkan ke halaman khusus
            return res.render('public/layout', { 
                title: 'Pendaftaran Ditutup', 
                bodyView: 'pendaftaran-tutup' 
            });
        }
    } catch (err) {
        console.error('Error in checkRegistrationOpen middleware:', err);
        return res.status(500).send('Terjadi kesalahan pada sistem. Silakan coba beberapa saat lagi.');
    }
};
