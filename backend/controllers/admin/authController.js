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

exports.updateProfile = async (req, res) => {
    const { username, nama_lengkap, password_lama, password_baru } = req.body;
    const adminId = req.admin.id;

    try {
        const [rows] = await db.execute('SELECT * FROM admin WHERE id = ?', [adminId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Admin tidak ditemukan!' });
        }

        const admin = rows[0];

        if (username !== admin.username) {
            const [existing] = await db.execute('SELECT * FROM admin WHERE username = ? AND id != ?', [username, adminId]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: 'Username sudah digunakan oleh admin lain!' });
            }
        }

        let updatedPassword = admin.password;

        if (password_baru && password_baru.trim() !== '') {
            if (!password_lama) {
                return res.status(400).json({ success: false, message: 'Password lama wajib diisi untuk mengubah password!' });
            }
            const isMatch = await bcrypt.compare(password_lama, admin.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Password lama salah!' });
            }
            
            updatedPassword = await bcrypt.hash(password_baru, 10);
        }

        await db.execute(
            'UPDATE admin SET username = ?, nama_lengkap = ?, password = ? WHERE id = ?',
            [username, nama_lengkap, updatedPassword, adminId]
        );

        const token = jwt.sign(
            { id: adminId, username: username, nama: nama_lengkap },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 8 * 60 * 60 * 1000
        });

        return res.json({ success: true, message: 'Profil admin berhasil diperbarui!' });
    } catch (error) {
        console.error('Update Profile Error:', error);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem internal.' });
    }
};

exports.addAdmin = async (req, res) => {
    const { username, nama_lengkap, password } = req.body;

    try {
        const [existing] = await db.execute('SELECT * FROM admin WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Username sudah terdaftar!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
            'INSERT INTO admin (username, nama_lengkap, password) VALUES (?, ?, ?)',
            [username, nama_lengkap, hashedPassword]
        );

        return res.json({ success: true, message: 'Admin baru berhasil ditambahkan!' });
    } catch (error) {
        console.error('Add Admin Error:', error);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem internal.' });
    }
};

exports.getAdminList = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, username, nama_lengkap FROM admin ORDER BY id ASC');
        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Get Admin List Error:', error);
        return res.status(500).json({ success: false, message: 'Gagal mengambil data admin.' });
    }
};

exports.editAdmin = async (req, res) => {
    const { id } = req.params;
    const { username, nama_lengkap, password } = req.body;

    try {
        const [adminExists] = await db.execute('SELECT * FROM admin WHERE id = ?', [id]);
        if (adminExists.length === 0) {
            return res.status(404).json({ success: false, message: 'Admin tidak ditemukan!' });
        }

        const admin = adminExists[0];

        if (username !== admin.username) {
            const [usernameExists] = await db.execute('SELECT * FROM admin WHERE username = ? AND id != ?', [username, id]);
            if (usernameExists.length > 0) {
                return res.status(400).json({ success: false, message: 'Username sudah terdaftar pada admin lain!' });
            }
        }

        let updatedPassword = admin.password;
        if (password && password.trim() !== '') {
            updatedPassword = await bcrypt.hash(password, 10);
        }

        await db.execute(
            'UPDATE admin SET username = ?, nama_lengkap = ?, password = ? WHERE id = ?',
            [username, nama_lengkap, updatedPassword, id]
        );

        return res.json({ success: true, message: 'Data admin berhasil diperbarui!' });
    } catch (error) {
        console.error('Edit Admin Error:', error);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem internal.' });
    }
};

exports.deleteAdmin = async (req, res) => {
    const { id } = req.params;

    if (parseInt(id) === parseInt(req.admin.id)) {
        return res.status(400).json({ success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang login!' });
    }

    try {
        const [result] = await db.execute('DELETE FROM admin WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Admin tidak ditemukan!' });
        }

        return res.json({ success: true, message: 'Admin berhasil dihapus!' });
    } catch (error) {
        console.error('Delete Admin Error:', error);
        return res.status(500).json({ success: false, message: 'Gagal menghapus admin.' });
    }
};
