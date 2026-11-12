const db = require('../config/db');

class SystemSettingModel {
    static async getSetting(key) {
        const [rows] = await db.execute('SELECT `value` FROM `system_settings` WHERE `key` = ?', [key]);
        if (rows.length > 0) {
            return rows[0].value;
        }
        return null;
    }

    static async setSetting(key, value) {
        // Check if exists
        const [rows] = await db.execute('SELECT id FROM `system_settings` WHERE `key` = ?', [key]);
        if (rows.length > 0) {
            await db.execute('UPDATE `system_settings` SET `value` = ? WHERE `key` = ?', [value, key]);
        } else {
            await db.execute('INSERT INTO `system_settings` (`key`, `value`) VALUES (?, ?)', [key, value]);
        }
    }

    // --- MANAJEMEN TAHUN AJARAN ---
    static async getAllTahunAjaran() {
        const [rows] = await db.execute('SELECT * FROM master_tahun_ajaran ORDER BY tahun_mulai DESC, id DESC');
        return rows;
    }

    static async getDefaultTahunAjaran() {
        const [rows] = await db.execute('SELECT * FROM master_tahun_ajaran WHERE is_default = 1 LIMIT 1');
        if (rows.length > 0) {
            return rows[0];
        }
        const curY = new Date().getFullYear();
        return {
            id: null,
            nama: `${curY}/${curY + 1}`,
            tahun_mulai: curY,
            tahun_selesai: curY + 1,
            status: 'Aktif',
            is_default: 1
        };
    }

    static async addTahunAjaran(nama, tahunMulai, tahunSelesai, status = 'Aktif') {
        const isAktif = (status === 'Aktif');
        if (isAktif) {
            await db.execute('UPDATE master_tahun_ajaran SET is_default = 0, status = "Nonaktif"');
        }
        const [result] = await db.execute(
            'INSERT INTO master_tahun_ajaran (nama, tahun_mulai, tahun_selesai, status, is_default) VALUES (?, ?, ?, ?, ?)',
            [nama.trim(), parseInt(tahunMulai, 10), parseInt(tahunSelesai, 10), isAktif ? 'Aktif' : 'Nonaktif', isAktif ? 1 : 0]
        );
        return result.insertId;
    }

    static async setDefaultTahunAjaran(id) {
        await db.execute('UPDATE master_tahun_ajaran SET is_default = 0, status = "Nonaktif"');
        await db.execute('UPDATE master_tahun_ajaran SET is_default = 1, status = "Aktif" WHERE id = ?', [id]);
    }

    static async updateTahunAjaran(id, nama, status) {
        const isAktif = (status === 'Aktif');
        if (isAktif) {
            await db.execute('UPDATE master_tahun_ajaran SET is_default = 0, status = "Nonaktif"');
            await db.execute(
                'UPDATE master_tahun_ajaran SET nama = ?, status = "Aktif", is_default = 1 WHERE id = ?',
                [nama.trim(), id]
            );
        } else {
            await db.execute(
                'UPDATE master_tahun_ajaran SET nama = ?, status = "Nonaktif", is_default = 0 WHERE id = ?',
                [nama.trim(), id]
            );
        }
    }

    static async deleteTahunAjaran(id) {
        // Jangan hapus jika default aktif
        const [rows] = await db.execute('SELECT is_default FROM master_tahun_ajaran WHERE id = ?', [id]);
        if (rows.length > 0 && rows[0].is_default === 1) {
            throw new Error('Tidak dapat menghapus tahun ajaran yang sedang aktif sebagai default publik');
        }
        await db.execute('DELETE FROM master_tahun_ajaran WHERE id = ?', [id]);
    }
}

module.exports = SystemSettingModel;
