const db = require('../config/db');

class TagihanModel {
    // ---- Tagihan Baru ----
    static async getAllTagihan() {
        const [rows] = await db.execute('SELECT * FROM tagihan ORDER BY id DESC');
        return rows;
    }

    static async getTagihanPaginated(limit, offset, search = '', pendidikan = '') {
        let query = 'SELECT * FROM tagihan WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND nama LIKE ?';
            params.push(`%${search}%`);
        }
        
        if (pendidikan) {
            query += ' AND satuanPendidikan LIKE ?';
            params.push(`${pendidikan}%`);
        }

        query += ` ORDER BY id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
        
        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async getTotalTagihan(search = '', pendidikan = '') {
        let query = 'SELECT COUNT(*) as total FROM tagihan WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND nama LIKE ?';
            params.push(`%${search}%`);
        }
        
        if (pendidikan) {
            query += ' AND satuanPendidikan LIKE ?';
            params.push(`${pendidikan}%`);
        }

        const [rows] = await db.execute(query, params);
        return rows[0].total;
    }

    static async getTagihanById(id) {
        const [rows] = await db.execute('SELECT * FROM tagihan WHERE id = ?', [id]);
        return rows[0];
    }

    static async getTagihanByName(nama) {
        const [rows] = await db.execute('SELECT * FROM tagihan WHERE nama = ?', [nama]);
        return rows[0];
    }

    static async addTagihan(data) {
        const query = `
            INSERT INTO tagihan (
                nama, jalur, satuanPendidikan, formulir, uangPangkal, perlengkapan, seragam, spp, totalTagihan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            data.nama !== undefined ? data.nama : null,
            data.jalur !== undefined ? data.jalur : null,
            data.satuanPendidikan !== undefined ? data.satuanPendidikan : null,
            data.formulir !== undefined ? data.formulir : 0,
            data.uangPangkal !== undefined ? data.uangPangkal : 0,
            data.perlengkapan !== undefined ? data.perlengkapan : 0,
            data.seragam !== undefined ? data.seragam : 0,
            data.spp !== undefined ? data.spp : 0,
            data.totalTagihan !== undefined ? data.totalTagihan : 0
        ];
        const [result] = await db.execute(query, values);
        return result.insertId;
    }

    static async updateTagihan(id, data) {
        const query = `
            UPDATE tagihan SET 
                nama = COALESCE(?, nama),
                jalur = COALESCE(?, jalur),
                satuanPendidikan = COALESCE(?, satuanPendidikan),
                formulir = COALESCE(?, formulir),
                uangPangkal = COALESCE(?, uangPangkal),
                perlengkapan = COALESCE(?, perlengkapan),
                seragam = COALESCE(?, seragam),
                spp = COALESCE(?, spp),
                totalTagihan = COALESCE(?, totalTagihan)
            WHERE id = ?
        `;
        const values = [
            data.nama !== undefined ? data.nama : null, data.jalur !== undefined ? data.jalur : null, data.satuanPendidikan !== undefined ? data.satuanPendidikan : null, data.formulir !== undefined ? data.formulir : null, data.uangPangkal !== undefined ? data.uangPangkal : null, 
            data.perlengkapan !== undefined ? data.perlengkapan : null, data.seragam !== undefined ? data.seragam : null, data.spp !== undefined ? data.spp : null, data.totalTagihan !== undefined ? data.totalTagihan : null,
            id
        ];
        await db.execute(query, values);
    }

    static async updateTagihanByName(nama, data) {
        const query = `
            UPDATE tagihan SET 
                nama = COALESCE(?, nama),
                jalur = COALESCE(?, jalur),
                satuanPendidikan = COALESCE(?, satuanPendidikan),
                formulir = COALESCE(?, formulir),
                uangPangkal = COALESCE(?, uangPangkal),
                perlengkapan = COALESCE(?, perlengkapan),
                seragam = COALESCE(?, seragam),
                spp = COALESCE(?, spp),
                totalTagihan = COALESCE(?, totalTagihan)
            WHERE nama = ?
        `;
        const values = [
            data.nama !== undefined ? data.nama : null, data.jalur !== undefined ? data.jalur : null, data.satuanPendidikan !== undefined ? data.satuanPendidikan : null, data.formulir !== undefined ? data.formulir : null, data.uangPangkal !== undefined ? data.uangPangkal : null, 
            data.perlengkapan !== undefined ? data.perlengkapan : null, data.seragam !== undefined ? data.seragam : null, data.spp !== undefined ? data.spp : null, data.totalTagihan !== undefined ? data.totalTagihan : null,
            nama
        ];
        await db.execute(query, values);
    }

    static async deleteTagihanByName(nama) {
        await db.execute('DELETE FROM tagihan WHERE nama = ?', [nama]);
    }

    static async deleteTagihanByNamaAndPendidikan(nama, pendidikan) {
        await db.execute('DELETE FROM tagihan WHERE nama = ? AND satuanPendidikan = ?', [nama, pendidikan]);
    }

    static async deleteTagihan(id) {
        await db.execute('DELETE FROM tagihan WHERE id = ?', [id]);
    }

    // ---- Tagihan Daftar Ulang ----
    static async getAllTagihanDaftarUlang() {
        const [rows] = await db.execute('SELECT * FROM tagihan_daftar_ulang ORDER BY id DESC');
        return rows;
    }

    static async getTagihanDaftarUlangPaginated(limit, offset, search = '', pendidikan = '') {
        let query = 'SELECT * FROM tagihan_daftar_ulang WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND nama LIKE ?';
            params.push(`%${search}%`);
        }
        
        if (pendidikan) {
            query += ' AND satuanPendidikan LIKE ?';
            params.push(`${pendidikan}%`);
        }

        query += ` ORDER BY id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
        
        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async getTotalTagihanDaftarUlang(search = '', pendidikan = '') {
        let query = 'SELECT COUNT(*) as total FROM tagihan_daftar_ulang WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND nama LIKE ?';
            params.push(`%${search}%`);
        }
        
        if (pendidikan) {
            query += ' AND satuanPendidikan LIKE ?';
            params.push(`${pendidikan}%`);
        }

        const [rows] = await db.execute(query, params);
        return rows[0].total;
    }

    static async getTagihanDaftarUlangById(id) {
        const [rows] = await db.execute('SELECT * FROM tagihan_daftar_ulang WHERE id = ?', [id]);
        return rows[0];
    }

    static async getTagihanDaftarUlangByName(nama) {
        const [rows] = await db.execute('SELECT * FROM tagihan_daftar_ulang WHERE nama = ?', [nama]);
        return rows[0];
    }

    static async addTagihanDaftarUlang(data) {
        const query = `
            INSERT INTO tagihan_daftar_ulang (
                nama, jalur, satuanPendidikanSebelumnya, satuanPendidikan, formulir, 
                uangPangkal, perlengkapan, seragam, spp, totalTagihan
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            data.nama !== undefined ? data.nama : null,
            data.jalur !== undefined ? data.jalur : null,
            data.satuanPendidikanSebelumnya !== undefined ? data.satuanPendidikanSebelumnya : null,
            data.satuanPendidikan !== undefined ? data.satuanPendidikan : null,
            data.formulir !== undefined ? data.formulir : 0,
            data.uangPangkal !== undefined ? data.uangPangkal : 0,
            data.perlengkapan !== undefined ? data.perlengkapan : 0,
            data.seragam !== undefined ? data.seragam : 0,
            data.spp !== undefined ? data.spp : 0,
            data.totalTagihan !== undefined ? data.totalTagihan : 0
        ];
        const [result] = await db.execute(query, values);
        return result.insertId;
    }

    static async updateTagihanDaftarUlang(id, data) {
        const query = `
            UPDATE tagihan_daftar_ulang SET 
                nama = COALESCE(?, nama),
                jalur = COALESCE(?, jalur),
                satuanPendidikanSebelumnya = COALESCE(?, satuanPendidikanSebelumnya),
                satuanPendidikan = COALESCE(?, satuanPendidikan),
                formulir = COALESCE(?, formulir),
                uangPangkal = COALESCE(?, uangPangkal),
                perlengkapan = COALESCE(?, perlengkapan),
                seragam = COALESCE(?, seragam),
                spp = COALESCE(?, spp),
                totalTagihan = COALESCE(?, totalTagihan)
            WHERE id = ?
        `;
        const values = [
            data.nama !== undefined ? data.nama : null, data.jalur !== undefined ? data.jalur : null, data.satuanPendidikanSebelumnya !== undefined ? data.satuanPendidikanSebelumnya : null, data.satuanPendidikan !== undefined ? data.satuanPendidikan : null, data.formulir !== undefined ? data.formulir : null, 
            data.uangPangkal !== undefined ? data.uangPangkal : null, data.perlengkapan !== undefined ? data.perlengkapan : null, data.seragam !== undefined ? data.seragam : null, data.spp !== undefined ? data.spp : null, data.totalTagihan !== undefined ? data.totalTagihan : null,
            id
        ];
        await db.execute(query, values);
    }

    static async updateTagihanDaftarUlangByName(nama, data) {
        const query = `
            UPDATE tagihan_daftar_ulang SET 
                nama = COALESCE(?, nama),
                jalur = COALESCE(?, jalur),
                satuanPendidikanSebelumnya = COALESCE(?, satuanPendidikanSebelumnya),
                satuanPendidikan = COALESCE(?, satuanPendidikan),
                formulir = COALESCE(?, formulir),
                uangPangkal = COALESCE(?, uangPangkal),
                perlengkapan = COALESCE(?, perlengkapan),
                seragam = COALESCE(?, seragam),
                spp = COALESCE(?, spp),
                totalTagihan = COALESCE(?, totalTagihan)
            WHERE nama = ?
        `;
        const values = [
            data.nama !== undefined ? data.nama : null, data.jalur !== undefined ? data.jalur : null, data.satuanPendidikanSebelumnya !== undefined ? data.satuanPendidikanSebelumnya : null, data.satuanPendidikan !== undefined ? data.satuanPendidikan : null, data.formulir !== undefined ? data.formulir : null, 
            data.uangPangkal !== undefined ? data.uangPangkal : null, data.perlengkapan !== undefined ? data.perlengkapan : null, data.seragam !== undefined ? data.seragam : null, data.spp !== undefined ? data.spp : null, data.totalTagihan !== undefined ? data.totalTagihan : null,
            nama
        ];
        await db.execute(query, values);
    }

    static async deleteTagihanDaftarUlangByName(nama) {
        await db.execute('DELETE FROM tagihan_daftar_ulang WHERE nama = ?', [nama]);
    }

    static async deleteTagihanDaftarUlangByNamaAndPendidikan(nama, pendidikan) {
        await db.execute('DELETE FROM tagihan_daftar_ulang WHERE nama = ? AND satuanPendidikan = ?', [nama, pendidikan]);
    }

    static async deleteTagihanDaftarUlang(id) {
        await db.execute('DELETE FROM tagihan_daftar_ulang WHERE id = ?', [id]);
    }
}

module.exports = TagihanModel;
