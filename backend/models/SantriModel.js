const db = require('../config/db');

class SantriModel {
    // ---- Santri Baru ----
    static async getAllSantri() {
        const [rows] = await db.execute('SELECT * FROM santri ORDER BY id DESC');
        return rows;
    }

    static async getSantriPaginated(limit, offset, search = '', pendidikan = '') {
        let query = 'SELECT * FROM santri WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND nama LIKE ?';
            params.push(`%${search}%`);
        }
        
        if (pendidikan) {
            query += ' AND pendidikan LIKE ?';
            params.push(`${pendidikan}%`);
        }

        // Limit & offset langsung disisipkan karena sudah diparsing menjadi integer (aman dari SQL Injection)
        query += ` ORDER BY id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
        
        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async getTotalSantri(search = '', pendidikan = '') {
        let query = 'SELECT COUNT(*) as total FROM santri WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND nama LIKE ?';
            params.push(`%${search}%`);
        }
        
        if (pendidikan) {
            query += ' AND pendidikan LIKE ?';
            params.push(`${pendidikan}%`);
        }

        const [rows] = await db.execute(query, params);
        return rows[0].total;
    }

    static async getSantriById(id) {
        const [rows] = await db.execute('SELECT * FROM santri WHERE id = ?', [id]);
        return rows[0];
    }

    static async getSantriByName(nama) {
        const [rows] = await db.execute('SELECT * FROM santri WHERE nama = ?', [nama]);
        return rows[0];
    }

    static async addSantri(data) {
        const query = `
            INSERT INTO santri (
                nomorPendaftaran, timestamp, email, jalurPendaftaran, nama, namaPanggilan, 
                jenisKelamin, pendidikan, tempatLahir, tanggalLahir, agama, statusKeluarga, 
                anakKe, dariBersaudara, asalSekolah, usia, namaAyah, pekerjaanAyah, 
                teleponAyah, namaIbu, pekerjaanIbu, teleponIbu, alamat, noTelepon
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            data.nomorPendaftaran !== undefined ? data.nomorPendaftaran : null,
            data.timestamp !== undefined ? data.timestamp : null,
            data.email !== undefined ? data.email : null,
            data.jalurPendaftaran !== undefined ? data.jalurPendaftaran : null,
            data.nama !== undefined ? data.nama : null,
            data.namaPanggilan !== undefined ? data.namaPanggilan : null,
            data.jenisKelamin !== undefined ? data.jenisKelamin : null,
            data.pendidikan !== undefined ? data.pendidikan : null,
            data.tempatLahir !== undefined ? data.tempatLahir : null,
            data.tanggalLahir !== undefined ? data.tanggalLahir : null,
            data.agama !== undefined ? data.agama : null,
            data.statusKeluarga !== undefined ? data.statusKeluarga : null,
            data.anakKe !== undefined ? data.anakKe : null,
            data.dariBersaudara !== undefined ? data.dariBersaudara : null,
            data.asalSekolah !== undefined ? data.asalSekolah : null,
            data.usia !== undefined ? data.usia : 0,
            data.namaAyah !== undefined ? data.namaAyah : null,
            data.pekerjaanAyah !== undefined ? data.pekerjaanAyah : null,
            data.teleponAyah !== undefined ? data.teleponAyah : null,
            data.namaIbu !== undefined ? data.namaIbu : null,
            data.pekerjaanIbu !== undefined ? data.pekerjaanIbu : null,
            data.teleponIbu !== undefined ? data.teleponIbu : null,
            data.alamat !== undefined ? data.alamat : null,
            data.noTelepon !== undefined ? data.noTelepon : null
        ];
        const [result] = await db.execute(query, values);
        return result.insertId;
    }

    static async updateSantri(id, data) {
        const query = `
            UPDATE santri SET 
                email = COALESCE(?, email), 
                jalurPendaftaran = COALESCE(?, jalurPendaftaran), 
                nama = COALESCE(?, nama), 
                namaPanggilan = COALESCE(?, namaPanggilan), 
                jenisKelamin = COALESCE(?, jenisKelamin), 
                pendidikan = COALESCE(?, pendidikan), 
                tempatLahir = COALESCE(?, tempatLahir), 
                tanggalLahir = COALESCE(?, tanggalLahir), 
                agama = COALESCE(?, agama), 
                statusKeluarga = COALESCE(?, statusKeluarga), 
                anakKe = COALESCE(?, anakKe), 
                dariBersaudara = COALESCE(?, dariBersaudara), 
                asalSekolah = COALESCE(?, asalSekolah), 
                usia = COALESCE(?, usia), 
                namaAyah = COALESCE(?, namaAyah), 
                pekerjaanAyah = COALESCE(?, pekerjaanAyah), 
                teleponAyah = COALESCE(?, teleponAyah), 
                namaIbu = COALESCE(?, namaIbu), 
                pekerjaanIbu = COALESCE(?, pekerjaanIbu), 
                teleponIbu = COALESCE(?, teleponIbu), 
                alamat = COALESCE(?, alamat), 
                noTelepon = COALESCE(?, noTelepon)
            WHERE id = ?
        `;
        const values = [
            data.email !== undefined ? data.email : null, data.jalurPendaftaran !== undefined ? data.jalurPendaftaran : null, data.nama !== undefined ? data.nama : null, data.namaPanggilan !== undefined ? data.namaPanggilan : null,
            data.jenisKelamin !== undefined ? data.jenisKelamin : null, data.pendidikan !== undefined ? data.pendidikan : null, data.tempatLahir !== undefined ? data.tempatLahir : null, data.tanggalLahir !== undefined ? data.tanggalLahir : null, data.agama !== undefined ? data.agama : null, data.statusKeluarga !== undefined ? data.statusKeluarga : null,
            data.anakKe !== undefined ? data.anakKe : null, data.dariBersaudara !== undefined ? data.dariBersaudara : null, data.asalSekolah !== undefined ? data.asalSekolah : null, data.usia !== undefined ? data.usia : null, data.namaAyah !== undefined ? data.namaAyah : null, data.pekerjaanAyah !== undefined ? data.pekerjaanAyah : null,
            data.teleponAyah !== undefined ? data.teleponAyah : null, data.namaIbu !== undefined ? data.namaIbu : null, data.pekerjaanIbu !== undefined ? data.pekerjaanIbu : null, data.teleponIbu !== undefined ? data.teleponIbu : null, data.alamat !== undefined ? data.alamat : null, data.noTelepon !== undefined ? data.noTelepon : null,
            id
        ];
        await db.execute(query, values);
    }

    static async deleteSantri(id) {
        await db.execute('DELETE FROM santri WHERE id = ?', [id]);
    }

    // ---- Santri Daftar Ulang ----
    static async getAllSantriDaftarUlang() {
        const [rows] = await db.execute('SELECT * FROM santri_daftar_ulang ORDER BY id DESC');
        return rows;
    }

    static async getSantriDaftarUlangPaginated(limit, offset, search = '', pendidikan = '') {
        let query = 'SELECT * FROM santri_daftar_ulang WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND nama LIKE ?';
            params.push(`%${search}%`);
        }
        
        if (pendidikan) {
            query += ' AND lanjutKe LIKE ?';
            params.push(`${pendidikan}%`);
        }

        query += ` ORDER BY id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
        
        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async getTotalSantriDaftarUlang(search = '', pendidikan = '') {
        let query = 'SELECT COUNT(*) as total FROM santri_daftar_ulang WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND nama LIKE ?';
            params.push(`%${search}%`);
        }
        
        if (pendidikan) {
            query += ' AND lanjutKe LIKE ?';
            params.push(`${pendidikan}%`);
        }

        const [rows] = await db.execute(query, params);
        return rows[0].total;
    }

    static async getSantriDaftarUlangById(id) {
        const [rows] = await db.execute('SELECT * FROM santri_daftar_ulang WHERE id = ?', [id]);
        return rows[0];
    }

    static async getSantriDaftarUlangByName(nama) {
        const [rows] = await db.execute('SELECT * FROM santri_daftar_ulang WHERE nama = ?', [nama]);
        return rows[0];
    }

    static async addSantriDaftarUlang(data) {
        const query = `
            INSERT INTO santri_daftar_ulang (
                nomorPendaftaran, timestamp, email, jalurPendaftaran, nama, namaPanggilan, 
                jenisKelamin, unitSebelumnya, lanjutKe, tempatLahir, tanggalLahir, agama, statusKeluarga, 
                anakKe, dariBersaudara, asalSekolah, usia, namaAyah, pekerjaanAyah, 
                teleponAyah, namaIbu, pekerjaanIbu, teleponIbu, alamat, noTelepon
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            data.nomorPendaftaran !== undefined ? data.nomorPendaftaran : null,
            data.timestamp !== undefined ? data.timestamp : null,
            data.email !== undefined ? data.email : null,
            data.jalurPendaftaran !== undefined ? data.jalurPendaftaran : null,
            data.nama !== undefined ? data.nama : null,
            data.namaPanggilan !== undefined ? data.namaPanggilan : null,
            data.jenisKelamin !== undefined ? data.jenisKelamin : null,
            data.unitSebelumnya !== undefined ? data.unitSebelumnya : null,
            data.lanjutKe !== undefined ? data.lanjutKe : null,
            data.tempatLahir !== undefined ? data.tempatLahir : null,
            data.tanggalLahir !== undefined ? data.tanggalLahir : null,
            data.agama !== undefined ? data.agama : null,
            data.statusKeluarga !== undefined ? data.statusKeluarga : null,
            data.anakKe !== undefined ? data.anakKe : null,
            data.dariBersaudara !== undefined ? data.dariBersaudara : null,
            data.asalSekolah !== undefined ? data.asalSekolah : null,
            data.usia !== undefined ? data.usia : 0,
            data.namaAyah !== undefined ? data.namaAyah : null,
            data.pekerjaanAyah !== undefined ? data.pekerjaanAyah : null,
            data.teleponAyah !== undefined ? data.teleponAyah : null,
            data.namaIbu !== undefined ? data.namaIbu : null,
            data.pekerjaanIbu !== undefined ? data.pekerjaanIbu : null,
            data.teleponIbu !== undefined ? data.teleponIbu : null,
            data.alamat !== undefined ? data.alamat : null,
            data.noTelepon !== undefined ? data.noTelepon : null
        ];
        const [result] = await db.execute(query, values);
        return result.insertId;
    }

    static async updateSantriDaftarUlang(id, data) {
        const query = `
            UPDATE santri_daftar_ulang SET 
                email = COALESCE(?, email), 
                jalurPendaftaran = COALESCE(?, jalurPendaftaran), 
                nama = COALESCE(?, nama), 
                namaPanggilan = COALESCE(?, namaPanggilan), 
                jenisKelamin = COALESCE(?, jenisKelamin), 
                unitSebelumnya = COALESCE(?, unitSebelumnya), 
                lanjutKe = COALESCE(?, lanjutKe), 
                tempatLahir = COALESCE(?, tempatLahir), 
                tanggalLahir = COALESCE(?, tanggalLahir), 
                agama = COALESCE(?, agama), 
                statusKeluarga = COALESCE(?, statusKeluarga), 
                anakKe = COALESCE(?, anakKe), 
                dariBersaudara = COALESCE(?, dariBersaudara), 
                asalSekolah = COALESCE(?, asalSekolah), 
                usia = COALESCE(?, usia), 
                namaAyah = COALESCE(?, namaAyah), 
                pekerjaanAyah = COALESCE(?, pekerjaanAyah), 
                teleponAyah = COALESCE(?, teleponAyah), 
                namaIbu = COALESCE(?, namaIbu), 
                pekerjaanIbu = COALESCE(?, pekerjaanIbu), 
                teleponIbu = COALESCE(?, teleponIbu), 
                alamat = COALESCE(?, alamat), 
                noTelepon = COALESCE(?, noTelepon)
            WHERE id = ?
        `;
        const values = [
            data.email !== undefined ? data.email : null,
            data.jalurPendaftaran !== undefined ? data.jalurPendaftaran : null,
            data.nama !== undefined ? data.nama : null,
            data.namaPanggilan !== undefined ? data.namaPanggilan : null,
            data.jenisKelamin !== undefined ? data.jenisKelamin : null,
            data.unitSebelumnya !== undefined ? data.unitSebelumnya : null,
            data.lanjutKe !== undefined ? data.lanjutKe : null,
            data.tempatLahir !== undefined ? data.tempatLahir : null,
            data.tanggalLahir !== undefined ? data.tanggalLahir : null,
            data.agama !== undefined ? data.agama : null,
            data.statusKeluarga !== undefined ? data.statusKeluarga : null,
            data.anakKe !== undefined ? data.anakKe : null,
            data.dariBersaudara !== undefined ? data.dariBersaudara : null,
            data.asalSekolah !== undefined ? data.asalSekolah : null,
            data.usia !== undefined ? data.usia : null,
            data.namaAyah !== undefined ? data.namaAyah : null,
            data.pekerjaanAyah !== undefined ? data.pekerjaanAyah : null,
            data.teleponAyah !== undefined ? data.teleponAyah : null,
            data.namaIbu !== undefined ? data.namaIbu : null,
            data.pekerjaanIbu !== undefined ? data.pekerjaanIbu : null,
            data.teleponIbu !== undefined ? data.teleponIbu : null,
            data.alamat !== undefined ? data.alamat : null,
            data.noTelepon !== undefined ? data.noTelepon : null,
            id
        ];
        await db.execute(query, values);
    }

    static async deleteSantriDaftarUlang(id) {
        await db.execute('DELETE FROM santri_daftar_ulang WHERE id = ?', [id]);
    }
}

module.exports = SantriModel;
