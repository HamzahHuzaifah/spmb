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

    static async getAllSantriFiltered(search = '', pendidikan = '') {
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

        query += ` ORDER BY id DESC`;
        
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

    static async getSantriByNomorPendaftaran(nomorPendaftaran) {
        const [rows] = await db.execute('SELECT * FROM santri WHERE nomorPendaftaran = ?', [nomorPendaftaran]);
        return rows[0];
    }

    static async getNextNomorPendaftaranBaru(year) {
        const prefix = `SPMB-Daftar.Baru/${year}/MJIC/%`;
        const query = `
            SELECT nomorPendaftaran 
            FROM santri 
            WHERE nomorPendaftaran LIKE ?
        `;
        const [rows] = await db.execute(query, [prefix]);
        
        let maxSeq = 0;
        for (const row of rows) {
            if (row.nomorPendaftaran) {
                const parts = row.nomorPendaftaran.split('/');
                const seqStr = parts[parts.length - 1];
                const seq = parseInt(seqStr, 10);
                if (!isNaN(seq) && seq > maxSeq) {
                    maxSeq = seq;
                }
            }
        }
        
        const nextSeq = maxSeq + 1;
        return `SPMB-Daftar.Baru/${year}/MJIC/${String(nextSeq).padStart(3, '0')}`;
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

    static async setStatusSantri(id, status) {
        await db.execute('UPDATE santri SET status_santri = ? WHERE id = ?', [status, id]);
    }

    static async deleteSantri(id) {
        await db.execute('DELETE FROM santri WHERE id = ?', [id]);
    }

    static async getSantriCountByNamaAndPendidikan(nama, pendidikan) {
        const [rows] = await db.execute('SELECT COUNT(*) as total FROM santri WHERE nama = ? AND pendidikan = ?', [nama, pendidikan]);
        return rows[0].total;
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

    static async getAllSantriDaftarUlangFiltered(search = '', pendidikan = '') {
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

        query += ` ORDER BY id DESC`;
        
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

    static async getSantriDaftarUlangByNomorPendaftaran(nomorPendaftaran) {
        const [rows] = await db.execute('SELECT * FROM santri_daftar_ulang WHERE nomorPendaftaran = ?', [nomorPendaftaran]);
        return rows[0];
    }

    static async getNextNomorPendaftaranUlang(year) {
        const prefix = `SPMB-Daftar.Ulang/${year}/MJIC/%`;
        const query = `
            SELECT nomorPendaftaran 
            FROM santri_daftar_ulang 
            WHERE nomorPendaftaran LIKE ?
        `;
        const [rows] = await db.execute(query, [prefix]);
        
        let maxSeq = 0;
        for (const row of rows) {
            if (row.nomorPendaftaran) {
                const parts = row.nomorPendaftaran.split('/');
                const seqStr = parts[parts.length - 1];
                const seq = parseInt(seqStr, 10);
                if (!isNaN(seq) && seq > maxSeq) {
                    maxSeq = seq;
                }
            }
        }
        
        const nextSeq = maxSeq + 1;
        return `SPMB-Daftar.Ulang/${year}/MJIC/${String(nextSeq).padStart(3, '0')}`;
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

    static async getSantriDaftarUlangCountByNamaAndLanjutKe(nama, lanjutKe) {
        const [rows] = await db.execute('SELECT COUNT(*) as total FROM santri_daftar_ulang WHERE nama = ? AND lanjutKe = ?', [nama, lanjutKe]);
        return rows[0].total;
    }

    static async getSantriDuplicates(nama, pendidikan, excludeId) {
        const [rows] = await db.execute(
            'SELECT * FROM santri WHERE nama = ? AND pendidikan = ? AND id != ?',
            [nama, pendidikan, excludeId]
        );
        return rows;
    }

    static async getSantriDaftarUlangDuplicates(nama, lanjutKe, excludeId) {
        const [rows] = await db.execute(
            'SELECT * FROM santri_daftar_ulang WHERE nama = ? AND lanjutKe = ? AND id != ?',
            [nama, lanjutKe, excludeId]
        );
        return rows;
    }

    static async logDeletedRegistration(nomorPendaftaran, nama, nomorPendaftaranAktif) {
        await db.execute(
            'INSERT IGNORE INTO deleted_registrations (nomorPendaftaran, nama, nomorPendaftaranAktif) VALUES (?, ?, ?)',
            [nomorPendaftaran, nama, nomorPendaftaranAktif]
        );
    }

    static async getDeletedRegistration(nomorPendaftaran) {
        const [rows] = await db.execute(
            'SELECT * FROM deleted_registrations WHERE nomorPendaftaran = ?',
            [nomorPendaftaran]
        );
        return rows[0];
    }

    static async findExistingSantri(nama, tanggalLahir, namaAyah) {
        const [rows] = await db.execute(
            'SELECT nomorPendaftaran FROM santri WHERE LOWER(nama) = LOWER(?) AND tanggalLahir = ? AND LOWER(namaAyah) = LOWER(?)',
            [nama.trim(), tanggalLahir, namaAyah.trim()]
        );
        return rows[0];
    }

    static async findExistingSantriDaftarUlang(nama, tanggalLahir, namaAyah) {
        const [rows] = await db.execute(
            'SELECT nomorPendaftaran FROM santri_daftar_ulang WHERE LOWER(nama) = LOWER(?) AND tanggalLahir = ? AND LOWER(namaAyah) = LOWER(?)',
            [nama.trim(), tanggalLahir, namaAyah.trim()]
        );
        return rows[0];
    }

    static async checkDuplicateFuzzy(data, type = 'baru') {
        const tableName = type === 'baru' ? 'santri' : 'santri_daftar_ulang';
        const query = `
            SELECT nama, nomorPendaftaran, tanggalLahir, namaAyah, email, teleponAyah 
            FROM ${tableName} 
            WHERE (namaAyah IS NOT NULL AND LOWER(namaAyah) = LOWER(?)) 
               OR (email IS NOT NULL AND email = ?) 
               OR (teleponAyah IS NOT NULL AND teleponAyah = ?) 
               OR (noTelepon IS NOT NULL AND noTelepon = ?)
        `;
        const params = [
            (data.namaAyah || '').trim(),
            (data.email || '').trim(),
            (data.teleponAyah || '').trim(),
            (data.teleponAyah || '').trim()
        ];
        
        const [candidates] = await db.execute(query, params);
        
        const inputNama = (data.nama || '').trim().toLowerCase();
        const inputDOB = data.tanggalLahir;
        
        for (const cand of candidates) {
            const candNama = (cand.nama || '').trim().toLowerCase();
            const candDOB = cand.tanggalLahir;
            
            // Calculate similarity
            const sim = getSimilarity(candNama, inputNama);
            const isExactName = (candNama === inputNama);
            
            // Compare DOB
            const isSameDOB = candDOB && inputDOB && 
                (new Date(candDOB).toDateString() === new Date(inputDOB).toDateString());
                
            // 1. Exact name match (regardless of DOB, to prevent DOB bypass)
            if (isExactName) {
                return cand;
            }
            
            // 2. High similarity (>= 85%) and different DOB (bypass attempt / typo)
            if (sim >= 0.85 && !isSameDOB) {
                return cand;
            }
        }
        
        return null;
    }

    static async checkHasDuplicate(santri, type = 'baru') {
        const tableName = type === 'baru' ? 'santri' : 'santri_daftar_ulang';
        const query = `
            SELECT id, nama, tanggalLahir, namaAyah, email, teleponAyah 
            FROM ${tableName} 
            WHERE id != ? 
              AND (
                LOWER(nama) = LOWER(?) 
                OR (namaAyah IS NOT NULL AND LOWER(namaAyah) = LOWER(?)) 
                OR (email IS NOT NULL AND email = ?) 
                OR (teleponAyah IS NOT NULL AND teleponAyah = ?)
              )
        `;
        const params = [
            santri.id,
            (santri.nama || '').trim(),
            (santri.namaAyah || '').trim(),
            (santri.email || '').trim(),
            (santri.teleponAyah || '').trim()
        ];
        const [rows] = await db.execute(query, params);
        if (rows.length === 0) return false;
        
        const inputNama = (santri.nama || '').trim().toLowerCase();
        const inputDOB = santri.tanggalLahir;
        
        for (const cand of rows) {
            const candNama = (cand.nama || '').trim().toLowerCase();
            const candDOB = cand.tanggalLahir;
            
            // Calculate similarity
            const sim = getSimilarity(candNama, inputNama);
            const isExactName = (candNama === inputNama);
            
            // Compare DOB
            const isSameDOB = candDOB && inputDOB && 
                (new Date(candDOB).toDateString() === new Date(inputDOB).toDateString());
                
            // 1. Exact name match (regardless of DOB)
            if (isExactName) {
                return true;
            }
            // 2. High similarity (>= 85%) and different DOB
            if (sim >= 0.85 && !isSameDOB) {
                return true;
            }
        }
        
        return false;
    }
}

function getLevenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1  // deletion
                    )
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function getSimilarity(s1, s2) {
    let longer = s1.toLowerCase().trim();
    let shorter = s2.toLowerCase().trim();
    if (longer.length < shorter.length) {
        let temp = longer;
        longer = shorter;
        shorter = temp;
    }
    const longerLength = longer.length;
    if (longerLength === 0) {
        return 1.0;
    }
    return (longerLength - getLevenshteinDistance(longer, shorter)) / parseFloat(longerLength);
}

module.exports = SantriModel;

