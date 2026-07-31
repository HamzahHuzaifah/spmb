const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../../utils/logActivity');

exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, username, nama_lengkap, role, is_active FROM admin ORDER BY id ASC');
        res.render('superadmin/users', { 
            title: 'Manajemen Pengguna',
            users: users,
            bodyView: 'users' // Optional if using layout
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};

exports.addUser = async (req, res) => {
    const { username, nama_lengkap, password, role } = req.body;
    try {
        const [existing] = await db.execute('SELECT * FROM admin WHERE username = ?', [username]);
        if (existing.length > 0) return res.status(400).json({ success: false, message: 'Username sudah digunakan' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO admin (username, nama_lengkap, password, role) VALUES (?, ?, ?, ?)',
            [username, nama_lengkap, hashedPassword, role]
        );
        
        await logActivity(req, 'Tambah Pengguna Baru', 'admin', result.insertId, `Username: ${username}, Role: ${role}`);
        res.json({ success: true, message: 'Pengguna berhasil ditambahkan' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal menambahkan pengguna' });
    }
};

exports.editUser = async (req, res) => {
    const { id } = req.params;
    const { username, nama_lengkap, password, role, is_active } = req.body;
    try {
        const [adminExists] = await db.execute('SELECT * FROM admin WHERE id = ?', [id]);
        if (adminExists.length === 0) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        
        let updatedPassword = adminExists[0].password;
        if (password && password.trim() !== '') {
            updatedPassword = await bcrypt.hash(password, 10);
        }

        await db.execute(
            'UPDATE admin SET username = ?, nama_lengkap = ?, password = ?, role = ?, is_active = ? WHERE id = ?',
            [username, nama_lengkap, updatedPassword, role, is_active, id]
        );
        
        await logActivity(req, 'Edit Pengguna', 'admin', id, `Username: ${username}, Role: ${role}, Status: ${is_active}`);
        res.json({ success: true, message: 'Pengguna berhasil diperbarui' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal memperbarui pengguna' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    if (parseInt(id) === parseInt(req.admin.id)) {
        return res.status(400).json({ success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri' });
    }

    try {
        await db.execute('DELETE FROM admin WHERE id = ?', [id]);
        await logActivity(req, 'Hapus Pengguna', 'admin', id, `ID User yang dihapus: ${id}`);
        res.json({ success: true, message: 'Pengguna berhasil dihapus' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal menghapus pengguna' });
    }
};
