const jwt = require('jsonwebtoken');
const SystemSettingModel = require('../models/SystemSetting');

// Secret Key harus persis sama dengan yang di authController
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_super_aman_spmb';

const cekAuth = async (req, res, next) => {
    // Daftar path prefix yang wajib menggunakan autentikasi admin
    const adminPathPrefixes = [
        '/dashboard',
        '/laporan',
        '/laporan-bulanan',
        '/tagihan',
        '/tagihan-daftar-ulang',
        '/tunggakan',
        '/tunggakan-daftar-ulang',
        '/santri',
        '/santri-daftar-ulang',
        '/input-transaksi',
        '/api',
        '/kwitansi',
        '/sso',
        '/set-tahun-ajaran'
    ];

    const path = req.path;
    // Periksa apakah path saat ini membutuhkan autentikasi admin
    const isAdminPath = adminPathPrefixes.some(prefix => path === prefix || path.startsWith(prefix + '/'));

    if (!isAdminPath) {
        // Bukan halaman admin, biarkan lewat untuk diproses oleh router lain atau 404 handler
        return next();
    }

    // Mengambil token dari cookies
    const token = req.cookies ? req.cookies.admin_token : null;

    if (!token) {
        // Jika tidak ada token (belum login), kembalikan ke halaman login
        return res.redirect('/login');
    }

    try {
        // Verifikasi keaslian token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Menyimpan data admin yang login ke objek request (bisa diakses di controller)
        req.admin = decoded; 
        res.locals.admin = decoded; // Tersedia otomatis di file EJS
        
        // Muat Data Tahun Ajaran untuk Switcher di Navbar
        try {
            const allTA = await SystemSettingModel.getAllTahunAjaran();
            const defaultTA = await SystemSettingModel.getDefaultTahunAjaran();
            res.locals.allTahunAjaran = allTA || [];
            
            let selectedTA = req.cookies ? req.cookies.selected_tahun_ajaran : null;
            if (!selectedTA) {
                selectedTA = defaultTA ? defaultTA.nama : 'ALL';
            }
            res.locals.selectedTahunAjaran = selectedTA;
            req.selectedTahunAjaran = selectedTA;
        } catch (taErr) {
            res.locals.allTahunAjaran = [];
            res.locals.selectedTahunAjaran = 'ALL';
            req.selectedTahunAjaran = 'ALL';
        }

        // Karcis asli! Silakan lewat
        next();
    } catch (err) {
        // Token palsu, diedit hacker, atau sudah kadaluarsa.
        res.clearCookie('admin_token');
        return res.redirect('/login');
    }
};

module.exports = { cekAuth };
