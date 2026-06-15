const db = require('../config/db');

class TunggakanModel {
    // ---- Tunggakan Baru ----
    static async getAllTunggakan() {
        const [rows] = await db.execute('SELECT * FROM tunggakan ORDER BY id DESC');
        return rows;
    }

    static async getTunggakanPaginated(limit, offset, search = '', status = '') {
        let query = 'SELECT * FROM tunggakan WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND nama LIKE ?';
            params.push(`%${search}%`);
        }
        
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ` ORDER BY id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
        
        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async getTotalTunggakan(search = '', status = '') {
        let query = 'SELECT COUNT(*) as total FROM tunggakan WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND nama LIKE ?';
            params.push(`%${search}%`);
        }
        
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        const [rows] = await db.execute(query, params);
        return rows[0].total;
    }

    static async searchTunggakanBaruAJAX(search = '', limit = 10, pendidikan = '') {
        let query = `
            SELECT t.nama, t.sisaBayar, t.satuanPendidikan, s.nomorPendaftaran 
            FROM tunggakan t 
            LEFT JOIN santri s ON t.nama = s.nama 
            WHERE (t.nama LIKE ? OR s.nomorPendaftaran LIKE ?)
            AND t.sisaBayar > 0
        `;
        let params = [`%${search}%`, `%${search}%`];
        if (pendidikan) {
            query += ' AND t.satuanPendidikan LIKE ?';
            params.push(`${pendidikan}%`);
        }
        query += ` ORDER BY t.nama ASC LIMIT ${parseInt(limit)}`;
        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async getTunggakanById(id) {
        const [rows] = await db.execute('SELECT * FROM tunggakan WHERE id = ?', [id]);
        return rows[0];
    }

    static async getTunggakanByName(nama) {
        const [rows] = await db.execute('SELECT * FROM tunggakan WHERE nama = ?', [nama]);
        return rows[0];
    }

    static async getTunggakanByNameAndPendidikan(nama, pendidikan) {
        const [rows] = await db.execute('SELECT * FROM tunggakan WHERE nama = ? AND satuanPendidikan LIKE ?', [nama, `${pendidikan}%`]);
        return rows[0];
    }

    static async addTunggakan(data) {
        const query = `
            INSERT INTO tunggakan (
                nama, satuanPendidikan, noTelepon, totalTagihan, totalBayar, sisaBayar, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            data.nama !== undefined ? data.nama : null, data.satuanPendidikan !== undefined ? data.satuanPendidikan : null, data.noTelepon !== undefined ? data.noTelepon : null, data.totalTagihan !== undefined ? data.totalTagihan : null, 
            data.totalBayar !== undefined ? data.totalBayar : null, data.sisaBayar !== undefined ? data.sisaBayar : null, data.status !== undefined ? data.status : null
        ];
        const [result] = await db.execute(query, values);
        return result.insertId;
    }

    static async updateTunggakan(id, data) {
        const query = `
            UPDATE tunggakan SET 
                nama = COALESCE(?, nama),
                satuanPendidikan = COALESCE(?, satuanPendidikan),
                noTelepon = COALESCE(?, noTelepon),
                totalTagihan = COALESCE(?, totalTagihan),
                totalBayar = COALESCE(?, totalBayar),
                sisaBayar = COALESCE(?, sisaBayar),
                status = COALESCE(?, status)
            WHERE id = ?
        `;
        const values = [
            data.nama !== undefined ? data.nama : null, data.satuanPendidikan !== undefined ? data.satuanPendidikan : null, data.noTelepon !== undefined ? data.noTelepon : null, data.totalTagihan !== undefined ? data.totalTagihan : null, 
            data.totalBayar !== undefined ? data.totalBayar : null, data.sisaBayar !== undefined ? data.sisaBayar : null, data.status !== undefined ? data.status : null,
            id
        ];
        await db.execute(query, values);
    }

    static async updateTunggakanByName(nama, data) {
        const query = `
            UPDATE tunggakan SET 
                nama = COALESCE(?, nama),
                satuanPendidikan = COALESCE(?, satuanPendidikan),
                noTelepon = COALESCE(?, noTelepon),
                totalTagihan = COALESCE(?, totalTagihan),
                totalBayar = COALESCE(?, totalBayar),
                sisaBayar = COALESCE(?, sisaBayar),
                status = COALESCE(?, status)
            WHERE nama = ?
        `;
        const values = [
            data.nama !== undefined ? data.nama : null, data.satuanPendidikan !== undefined ? data.satuanPendidikan : null, data.noTelepon !== undefined ? data.noTelepon : null, data.totalTagihan !== undefined ? data.totalTagihan : null, 
            data.totalBayar !== undefined ? data.totalBayar : null, data.sisaBayar !== undefined ? data.sisaBayar : null, data.status !== undefined ? data.status : null,
            nama
        ];
        await db.execute(query, values);
    }

    static async deleteTunggakanByName(nama) {
        await db.execute('DELETE FROM tunggakan WHERE nama = ?', [nama]);
    }

    static async deleteTunggakanByNamaAndPendidikan(nama, pendidikan) {
        await db.execute('DELETE FROM tunggakan WHERE nama = ? AND satuanPendidikan = ?', [nama, pendidikan]);
    }

    static async deleteTunggakan(id) {
        await db.execute('DELETE FROM tunggakan WHERE id = ?', [id]);
    }

    // ---- Tunggakan Daftar Ulang ----
    static async getAllTunggakanDaftarUlang() {
        const [rows] = await db.execute('SELECT * FROM tunggakan_daftar_ulang ORDER BY id DESC');
        return rows;
    }

    static async getTunggakanDaftarUlangPaginated(limit, offset, search = '', status = '') {
        let query = 'SELECT * FROM tunggakan_daftar_ulang WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND nama LIKE ?';
            params.push(`%${search}%`);
        }
        
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ` ORDER BY id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
        
        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async getTotalTunggakanDaftarUlang(search = '', status = '') {
        let query = 'SELECT COUNT(*) as total FROM tunggakan_daftar_ulang WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND nama LIKE ?';
            params.push(`%${search}%`);
        }
        
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        const [rows] = await db.execute(query, params);
        return rows[0].total;
    }

    static async searchTunggakanDaftarUlangAJAX(search = '', limit = 10, pendidikan = '') {
        let query = `
            SELECT t.nama, t.sisaBayar, t.satuanPendidikan, s.nomorPendaftaran 
            FROM tunggakan_daftar_ulang t 
            LEFT JOIN santri_daftar_ulang s ON t.nama = s.nama 
            WHERE (t.nama LIKE ? OR s.nomorPendaftaran LIKE ?)
            AND t.sisaBayar > 0
        `;
        let params = [`%${search}%`, `%${search}%`];
        if (pendidikan) {
            query += ' AND t.satuanPendidikan LIKE ?';
            params.push(`${pendidikan}%`);
        }
        query += ` ORDER BY t.nama ASC LIMIT ${parseInt(limit)}`;
        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async getTunggakanDaftarUlangById(id) {
        const [rows] = await db.execute('SELECT * FROM tunggakan_daftar_ulang WHERE id = ?', [id]);
        return rows[0];
    }

    static async getTunggakanDaftarUlangByName(nama) {
        const [rows] = await db.execute('SELECT * FROM tunggakan_daftar_ulang WHERE nama = ?', [nama]);
        return rows[0];
    }

    static async getTunggakanDaftarUlangByNameAndPendidikan(nama, pendidikan) {
        const [rows] = await db.execute('SELECT * FROM tunggakan_daftar_ulang WHERE nama = ? AND satuanPendidikan LIKE ?', [nama, `${pendidikan}%`]);
        return rows[0];
    }

    static async addTunggakanDaftarUlang(data) {
        const query = `
            INSERT INTO tunggakan_daftar_ulang (
                nama, satuanPendidikan, noTelepon, totalTagihan, totalBayar, sisaBayar, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            data.nama !== undefined ? data.nama : null, data.satuanPendidikan !== undefined ? data.satuanPendidikan : null, data.noTelepon !== undefined ? data.noTelepon : null, data.totalTagihan !== undefined ? data.totalTagihan : null, 
            data.totalBayar !== undefined ? data.totalBayar : null, data.sisaBayar !== undefined ? data.sisaBayar : null, data.status !== undefined ? data.status : null
        ];
        const [result] = await db.execute(query, values);
        return result.insertId;
    }

    static async updateTunggakanDaftarUlang(id, data) {
        const query = `
            UPDATE tunggakan_daftar_ulang SET 
                nama = COALESCE(?, nama),
                satuanPendidikan = COALESCE(?, satuanPendidikan),
                noTelepon = COALESCE(?, noTelepon),
                totalTagihan = COALESCE(?, totalTagihan),
                totalBayar = COALESCE(?, totalBayar),
                sisaBayar = COALESCE(?, sisaBayar),
                status = COALESCE(?, status)
            WHERE id = ?
        `;
        const values = [
            data.nama !== undefined ? data.nama : null, data.satuanPendidikan !== undefined ? data.satuanPendidikan : null, data.noTelepon !== undefined ? data.noTelepon : null, data.totalTagihan !== undefined ? data.totalTagihan : null, 
            data.totalBayar !== undefined ? data.totalBayar : null, data.sisaBayar !== undefined ? data.sisaBayar : null, data.status !== undefined ? data.status : null,
            id
        ];
        await db.execute(query, values);
    }

    static async updateTunggakanDaftarUlangByName(nama, data) {
        const query = `
            UPDATE tunggakan_daftar_ulang SET 
                nama = COALESCE(?, nama),
                satuanPendidikan = COALESCE(?, satuanPendidikan),
                noTelepon = COALESCE(?, noTelepon),
                totalTagihan = COALESCE(?, totalTagihan),
                totalBayar = COALESCE(?, totalBayar),
                sisaBayar = COALESCE(?, sisaBayar),
                status = COALESCE(?, status)
            WHERE nama = ?
        `;
        const values = [
            data.nama !== undefined ? data.nama : null, data.satuanPendidikan !== undefined ? data.satuanPendidikan : null, data.noTelepon !== undefined ? data.noTelepon : null, data.totalTagihan !== undefined ? data.totalTagihan : null, 
            data.totalBayar !== undefined ? data.totalBayar : null, data.sisaBayar !== undefined ? data.sisaBayar : null, data.status !== undefined ? data.status : null,
            nama
        ];
        await db.execute(query, values);
    }

    static async deleteTunggakanDaftarUlangByName(nama) {
        await db.execute('DELETE FROM tunggakan_daftar_ulang WHERE nama = ?', [nama]);
    }

    static async deleteTunggakanDaftarUlangByNamaAndPendidikan(nama, pendidikan) {
        await db.execute('DELETE FROM tunggakan_daftar_ulang WHERE nama = ? AND satuanPendidikan = ?', [nama, pendidikan]);
    }

    static async deleteTunggakanDaftarUlang(id) {
        await db.execute('DELETE FROM tunggakan_daftar_ulang WHERE id = ?', [id]);
    }
}

module.exports = TunggakanModel;
