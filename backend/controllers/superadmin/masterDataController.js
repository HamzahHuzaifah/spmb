const db = require('../../config/db');
const { logActivity } = require('../../utils/logActivity');
const SystemSettingModel = require('../../models/SystemSetting');

exports.getMasterData = async (req, res) => {
    try {
        const [jenjang] = await db.execute('SELECT * FROM master_jenjang ORDER BY id ASC');
        const [jalur] = await db.execute('SELECT * FROM master_jalur ORDER BY id ASC');
        const [gelombang] = await db.execute('SELECT * FROM master_gelombang ORDER BY id ASC');
        const [tahunAjaran] = await db.execute('SELECT * FROM master_tahun_ajaran ORDER BY tahun_mulai DESC, id DESC');

        const defaultTA = await SystemSettingModel.getDefaultTahunAjaran();
        const year = defaultTA.tahun_mulai || new Date().getFullYear();

        for (let j of jenjang) {
            const [countBaru] = await db.execute(`SELECT COUNT(*) as total FROM santri WHERE pendidikan = ? AND nomorPendaftaran LIKE ?`, [j.nama, `SPMB-Daftar.Baru/${year}/%`]);
            const [countUlang] = await db.execute(`SELECT COUNT(*) as total FROM santri_daftar_ulang WHERE lanjutKe = ? AND nomorPendaftaran LIKE ?`, [j.nama, `SPMB-Daftar.Ulang/${year}/%`]);
            const totalPendaftar = countBaru[0].total + countUlang[0].total;
            j.terisi = totalPendaftar;
            j.sisaKuota = j.kuota - totalPendaftar;
            if(j.sisaKuota < 0) j.sisaKuota = 0;
        }

        res.render('superadmin/master-data', {
            title: 'Master Data & Konfigurasi',
            jenjang,
            jalur,
            gelombang,
            tahunAjaran,
            defaultTA,
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
        const [oldRows] = await db.execute('SELECT nama FROM master_jenjang WHERE id = ?', [id]);
        if (oldRows.length > 0) {
            const oldName = oldRows[0].nama;
            const corePrefixes = ['PAUDQu', 'TPQ', 'MDT'];
            for (let prefix of corePrefixes) {
                if (oldName.startsWith(prefix) && !nama.startsWith(prefix)) {
                    return res.status(400).json({ success: false, message: `Tidak dapat mengubah awalan '${prefix}'. Nama baru harus tetap berawalan '${prefix}' untuk menjaga struktur pelaporan keuangan.` });
                }
            }
        }

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
        // Soft Delete to prevent orphan data
        await db.execute('UPDATE master_jenjang SET status = "Tidak Aktif" WHERE id = ?', [id]);
        await logActivity(req, 'Arsip Master Jenjang (Soft Delete)', 'master_jenjang', id, 'Status diubah ke Tidak Aktif');
        res.json({ success: true, message: 'Jenjang berhasil diarsipkan (Tidak Aktif)' });
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

// --- TAHUN AJARAN ---
exports.addTahunAjaran = async (req, res) => {
    const { nama, tahun_mulai, tahun_selesai, status } = req.body;
    try {
        const mul = parseInt(tahun_mulai, 10);
        const sel = parseInt(tahun_selesai, 10);
        if (!nama || isNaN(mul) || isNaN(sel)) {
            return res.status(400).json({ success: false, message: 'Data tahun ajaran tidak valid' });
        }

        const isAktif = (status === 'Aktif');
        if (isAktif) {
            // Jika tahun baru diset Aktif, nonaktifkan semua tahun ajaran lain
            await db.execute('UPDATE master_tahun_ajaran SET is_default = 0, status = "Nonaktif"');
        }

        const [result] = await db.execute(
            'INSERT INTO master_tahun_ajaran (nama, tahun_mulai, tahun_selesai, status, is_default) VALUES (?, ?, ?, ?, ?)',
            [nama.trim(), mul, sel, isAktif ? 'Aktif' : 'Nonaktif', isAktif ? 1 : 0]
        );
        await logActivity(req, 'Tambah Tahun Ajaran', 'master_tahun_ajaran', result.insertId, `Nama: ${nama}`);
        res.json({ success: true, message: 'Tahun ajaran berhasil ditambahkan' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal menambahkan tahun ajaran: ' + err.message });
    }
};

exports.editTahunAjaran = async (req, res) => {
    const { id } = req.params;
    const { nama, status } = req.body;
    try {
        const isAktif = (status === 'Aktif');
        if (isAktif) {
            // Jadikan yang ini satu-satunya yang aktif & default
            await db.execute('UPDATE master_tahun_ajaran SET is_default = 0, status = "Nonaktif"');
            await db.execute(
                'UPDATE master_tahun_ajaran SET nama = ?, status = "Aktif", is_default = 1 WHERE id = ?',
                [nama.trim(), id]
            );
        } else {
            // Cek apakah sedang default
            const [rows] = await db.execute('SELECT is_default FROM master_tahun_ajaran WHERE id = ?', [id]);
            if (rows.length > 0 && rows[0].is_default === 1) {
                return res.status(400).json({ success: false, message: 'Tahun ajaran aktif publik tidak dapat dinonaktifkan langsung. Silakan aktifkan tahun ajaran lain terlebih dahulu.' });
            }
            await db.execute(
                'UPDATE master_tahun_ajaran SET nama = ?, status = "Nonaktif", is_default = 0 WHERE id = ?',
                [nama.trim(), id]
            );
        }
        await logActivity(req, 'Edit Tahun Ajaran', 'master_tahun_ajaran', id, `Nama: ${nama}`);
        res.json({ success: true, message: 'Tahun ajaran berhasil diperbarui' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal memperbarui tahun ajaran: ' + err.message });
    }
};

exports.setDefaultTahunAjaran = async (req, res) => {
    const { id } = req.params;
    try {
        // Hanya satu tahun ajaran yang aktif & default
        await db.execute('UPDATE master_tahun_ajaran SET is_default = 0, status = "Nonaktif"');
        await db.execute('UPDATE master_tahun_ajaran SET is_default = 1, status = "Aktif" WHERE id = ?', [id]);
        await logActivity(req, 'Set Default Tahun Ajaran', 'master_tahun_ajaran', id, '');
        res.json({ success: true, message: 'Tahun ajaran aktif berhasil diubah' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal mengubah default tahun ajaran' });
    }
};

exports.deleteTahunAjaran = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.execute('SELECT is_default FROM master_tahun_ajaran WHERE id = ?', [id]);
        if (rows.length > 0 && rows[0].is_default === 1) {
            return res.status(400).json({ success: false, message: 'Tidak dapat menghapus tahun ajaran yang sedang aktif sebagai default publik!' });
        }
        await db.execute('DELETE FROM master_tahun_ajaran WHERE id = ?', [id]);
        await logActivity(req, 'Hapus Tahun Ajaran', 'master_tahun_ajaran', id, '');
        res.json({ success: true, message: 'Tahun ajaran berhasil dihapus' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal menghapus tahun ajaran' });
    }
};
