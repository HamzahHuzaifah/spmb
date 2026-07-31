const db = require('../../config/db');
const { logActivity } = require('../../utils/logActivity');

exports.getMasterData = async (req, res) => {
    try {
        const [jenjang] = await db.execute('SELECT * FROM master_jenjang ORDER BY id ASC');
        const [jalur] = await db.execute('SELECT * FROM master_jalur ORDER BY id ASC');
        const [gelombang] = await db.execute('SELECT * FROM master_gelombang ORDER BY id ASC');

        res.render('superadmin/master-data', {
            title: 'Master Data & Konfigurasi',
            jenjang,
            jalur,
            gelombang,
            bodyView: 'master-data'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};

// --- JENJANG ---
exports.addJenjang = async (req, res) => {
    const { nama, kuota, status } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO master_jenjang (nama, kuota, status) VALUES (?, ?, ?)',
            [nama, kuota, status || 'Aktif']
        );
        await logActivity(req, 'Tambah Master Jenjang', 'master_jenjang', result.insertId, `Nama: ${nama}, Kuota: ${kuota}`);
        res.json({ success: true, message: 'Jenjang berhasil ditambahkan' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal menambahkan jenjang' });
    }
};

exports.editJenjang = async (req, res) => {
    const { id } = req.params;
    const { nama, kuota, status } = req.body;
    try {
        await db.execute(
            'UPDATE master_jenjang SET nama = ?, kuota = ?, status = ? WHERE id = ?',
            [nama, kuota, status, id]
        );
        await logActivity(req, 'Edit Master Jenjang', 'master_jenjang', id, `Nama: ${nama}, Kuota: ${kuota}`);
        res.json({ success: true, message: 'Jenjang berhasil diperbarui' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal memperbarui jenjang' });
    }
};

exports.deleteJenjang = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM master_jenjang WHERE id = ?', [id]);
        await logActivity(req, 'Hapus Master Jenjang', 'master_jenjang', id, '');
        res.json({ success: true, message: 'Jenjang berhasil dihapus' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal menghapus jenjang' });
    }
};

// --- JALUR PENDAFTARAN ---
exports.addJalur = async (req, res) => {
    const { nama, biaya, syarat_dokumen, status } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO master_jalur (nama, biaya, syarat_dokumen, status) VALUES (?, ?, ?, ?)',
            [nama, biaya || 0, syarat_dokumen, status || 'Aktif']
        );
        await logActivity(req, 'Tambah Master Jalur', 'master_jalur', result.insertId, `Nama: ${nama}`);
        res.json({ success: true, message: 'Jalur berhasil ditambahkan' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal menambahkan jalur' });
    }
};

exports.editJalur = async (req, res) => {
    const { id } = req.params;
    const { nama, biaya, syarat_dokumen, status } = req.body;
    try {
        await db.execute(
            'UPDATE master_jalur SET nama = ?, biaya = ?, syarat_dokumen = ?, status = ? WHERE id = ?',
            [nama, biaya, syarat_dokumen, status, id]
        );
        await logActivity(req, 'Edit Master Jalur', 'master_jalur', id, `Nama: ${nama}`);
        res.json({ success: true, message: 'Jalur berhasil diperbarui' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal memperbarui jalur' });
    }
};

exports.deleteJalur = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM master_jalur WHERE id = ?', [id]);
        await logActivity(req, 'Hapus Master Jalur', 'master_jalur', id, '');
        res.json({ success: true, message: 'Jalur berhasil dihapus' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal menghapus jalur' });
    }
};

// --- GELOMBANG PENDAFTARAN ---
exports.addGelombang = async (req, res) => {
    const { nama, tanggal_mulai, tanggal_selesai, status, buka_pendaftaran_baru, buka_pendaftaran_beasiswa, buka_daftar_ulang } = req.body;
    try {
        const valBaru = buka_pendaftaran_baru ? 1 : 0;
        const valBeasiswa = buka_pendaftaran_beasiswa ? 1 : 0;
        const valUlang = buka_daftar_ulang ? 1 : 0;
        
        const [result] = await db.execute(
            'INSERT INTO master_gelombang (nama, tanggal_mulai, tanggal_selesai, status, buka_pendaftaran_baru, buka_pendaftaran_beasiswa, buka_daftar_ulang) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nama, tanggal_mulai, tanggal_selesai, status || 'Aktif', valBaru, valBeasiswa, valUlang]
        );
        await logActivity(req, 'Tambah Master Gelombang', 'master_gelombang', result.insertId, `Nama: ${nama}`);
        res.json({ success: true, message: 'Gelombang berhasil ditambahkan' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal menambahkan gelombang' });
    }
};

exports.editGelombang = async (req, res) => {
    const { id } = req.params;
    const { nama, tanggal_mulai, tanggal_selesai, status, buka_pendaftaran_baru, buka_pendaftaran_beasiswa, buka_daftar_ulang } = req.body;
    try {
        const valBaru = buka_pendaftaran_baru ? 1 : 0;
        const valBeasiswa = buka_pendaftaran_beasiswa ? 1 : 0;
        const valUlang = buka_daftar_ulang ? 1 : 0;

        await db.execute(
            'UPDATE master_gelombang SET nama = ?, tanggal_mulai = ?, tanggal_selesai = ?, status = ?, buka_pendaftaran_baru = ?, buka_pendaftaran_beasiswa = ?, buka_daftar_ulang = ? WHERE id = ?',
            [nama, tanggal_mulai, tanggal_selesai, status, valBaru, valBeasiswa, valUlang, id]
        );
        await logActivity(req, 'Edit Master Gelombang', 'master_gelombang', id, `Nama: ${nama}`);
        res.json({ success: true, message: 'Gelombang berhasil diperbarui' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal memperbarui gelombang' });
    }
};

exports.deleteGelombang = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM master_gelombang WHERE id = ?', [id]);
        await logActivity(req, 'Hapus Master Gelombang', 'master_gelombang', id, '');
        res.json({ success: true, message: 'Gelombang berhasil dihapus' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal menghapus gelombang' });
    }
};
