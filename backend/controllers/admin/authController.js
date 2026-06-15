const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mengambil Secret Key dari .env (atau fallback default)
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_super_aman_spmb';

exports.getLogin = (req, res) => {
    // Jika admin sudah punya token yang valid, lewati login langsung ke dashboard
    if (req.cookies && req.cookies.admin_token) {
        try {
            jwt.verify(req.cookies.admin_token, JWT_SECRET);
            return res.redirect('/dashboard');
        } catch (err) {
            // Abaikan jika token palsu/kadaluarsa, biarkan halaman login dirender
        }
    }
    res.render('admin-login', { error: null });
};

exports.postLogin = async (req, res) => {
    const { username, password } = req.body;
    try {
        // Cari admin di database
        const [rows] = await db.execute('SELECT * FROM admin WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.render('admin-login', { error: 'Username atau Password salah!' });
        }

        const admin = rows[0];
        
        // Verifikasi password dengan bcrypt
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.render('admin-login', { error: 'Username atau Password salah!' });
        }

        // Login Berhasil! Buat Token/Karcis
        const token = jwt.sign(
            { id: admin.id, username: admin.username, nama: admin.nama_lengkap },
            JWT_SECRET,
            { expiresIn: '8h' } // Token berlaku selama 8 jam
        );

        // Simpan token di Cookie secara aman
        res.cookie('admin_token', token, {
            httpOnly: true, // Mencegah akses Javascript frontend (anti XSS)
            secure: process.env.NODE_ENV === 'production', // Wajib HTTPS saat online
            maxAge: 8 * 60 * 60 * 1000 // Berlaku 8 jam
        });

        // Redirect ke dashboard admin
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login Error:', error);
        res.render('admin-login', { error: 'Terjadi kesalahan sistem internal.' });
    }
};

exports.getLogout = (req, res) => {
    // Menghapus cookie untuk logout
    res.clearCookie('admin_token');
    res.redirect('/login');
};
