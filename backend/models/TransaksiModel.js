const db = require('../config/db');

class TransaksiModel {
    // ---- Transaksi ----
    static async getAllTransaksi() {
        const [rows] = await db.execute('SELECT * FROM transaksi ORDER BY id DESC');
        return rows;
    }

    static async getTransaksiPaginated(limit, offset, search, filterTanggal, filterPendidikan) {
        let query = 'SELECT * FROM transaksi WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND (namaSantri LIKE ? OR noTransaksi LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (filterTanggal && filterTanggal.start && filterTanggal.end) {
            query += ' AND tanggal BETWEEN ? AND ?';
            params.push(filterTanggal.start, filterTanggal.end);
        }

        if (filterPendidikan) {
            query += ' AND satuanPendidikan LIKE ?';
            params.push(`${filterPendidikan}%`);
        }

        query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
        params.push(limit.toString(), offset.toString());

        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async getTotalTransaksi(search, filterTanggal, filterPendidikan) {
        let query = 'SELECT COUNT(*) as total FROM transaksi WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND (namaSantri LIKE ? OR noTransaksi LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (filterTanggal && filterTanggal.start && filterTanggal.end) {
            query += ' AND tanggal BETWEEN ? AND ?';
            params.push(filterTanggal.start, filterTanggal.end);
        }

        if (filterPendidikan) {
            query += ' AND satuanPendidikan LIKE ?';
            params.push(`${filterPendidikan}%`);
        }

        const [rows] = await db.execute(query, params);
        return rows[0].total;
    }

    static async getTransaksiById(id) {
        const [rows] = await db.execute('SELECT * FROM transaksi WHERE id = ?', [id]);
        return rows[0];
    }

    static async addTransaksi(data) {
        const query = `
            INSERT INTO transaksi (
                tanggal, noTransaksi, namaSantri, jenis, nominal, satuanPendidikan, 
                metodePembayaran, dibayarkanKepada, kategoriDana, rincianNames, 
                rincianNominals, diterimaDari, namaPemberi
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            data.tanggal !== undefined ? data.tanggal : null,
            data.noTransaksi !== undefined ? data.noTransaksi : null,
            data.namaSantri !== undefined ? data.namaSantri : null,
            data.jenis !== undefined ? data.jenis : null,
            data.nominal !== undefined ? data.nominal : 0,
            data.satuanPendidikan !== undefined ? data.satuanPendidikan : null,
            data.metodePembayaran !== undefined ? data.metodePembayaran : null,
            data.dibayarkanKepada !== undefined ? data.dibayarkanKepada : null,
            data.kategoriDana !== undefined ? data.kategoriDana : null,
            data.rincianNames ? JSON.stringify(data.rincianNames) : '[]',
            data.rincianNominals ? JSON.stringify(data.rincianNominals) : '[]',
            data.diterimaDari !== undefined ? data.diterimaDari : null,
            data.namaPemberi !== undefined ? data.namaPemberi : null
        ];
        const [result] = await db.execute(query, values);
        return result.insertId;
    }

    static async updateTransaksi(id, data) {
        const query = `
            UPDATE transaksi SET 
                tanggal = COALESCE(?, tanggal),
                noTransaksi = COALESCE(?, noTransaksi),
                namaSantri = COALESCE(?, namaSantri),
                jenis = COALESCE(?, jenis),
                nominal = COALESCE(?, nominal),
                satuanPendidikan = COALESCE(?, satuanPendidikan),
                metodePembayaran = COALESCE(?, metodePembayaran),
                dibayarkanKepada = COALESCE(?, dibayarkanKepada),
                kategoriDana = COALESCE(?, kategoriDana),
                rincianNames = COALESCE(?, rincianNames),
                rincianNominals = COALESCE(?, rincianNominals),
                diterimaDari = COALESCE(?, diterimaDari),
                namaPemberi = COALESCE(?, namaPemberi)
            WHERE id = ?
        `;
        const values = [
            data.tanggal !== undefined ? data.tanggal : null, data.noTransaksi !== undefined ? data.noTransaksi : null, data.namaSantri !== undefined ? data.namaSantri : null, data.jenis !== undefined ? data.jenis : null, data.nominal !== undefined ? data.nominal : null, data.satuanPendidikan !== undefined ? data.satuanPendidikan : null,
            data.metodePembayaran !== undefined ? data.metodePembayaran : null, data.dibayarkanKepada !== undefined ? data.dibayarkanKepada : null, data.kategoriDana !== undefined ? data.kategoriDana : null, 
            data.rincianNames !== undefined ? (typeof data.rincianNames === 'string' ? data.rincianNames : JSON.stringify(data.rincianNames)) : null, 
            data.rincianNominals !== undefined ? (typeof data.rincianNominals === 'string' ? data.rincianNominals : JSON.stringify(data.rincianNominals)) : null, 
            data.diterimaDari !== undefined ? data.diterimaDari : null, data.namaPemberi !== undefined ? data.namaPemberi : null,
            id
        ];
        await db.execute(query, values);
    }

    static async deleteTransaksi(id) {
        await db.execute('DELETE FROM transaksi WHERE id = ?', [id]);
    }

    static async deleteTransaksiAndLaporanByNamaAndPendidikan(nama, satuanPendidikan) {
        // Ambil semua transaksi yang cocok (contoh: 'TPQ A' LIKE CONCAT('TPQ', '%'))
        const [rows] = await db.execute('SELECT noTransaksi FROM transaksi WHERE namaSantri = ? AND ? LIKE CONCAT(satuanPendidikan, "%")', [nama, satuanPendidikan]);
        for (let row of rows) {
            // Hapus laporan berdasarkan noTransaksi
            await db.execute('DELETE FROM laporan WHERE noTransaksi = ?', [row.noTransaksi]);
        }
        // Hapus transaksinya
        await db.execute('DELETE FROM transaksi WHERE namaSantri = ? AND ? LIKE CONCAT(satuanPendidikan, "%")', [nama, satuanPendidikan]);
    }

    // ---- Laporan ----
    static async getAllLaporan() {
        const [rows] = await db.execute('SELECT * FROM laporan ORDER BY id ASC');
        return rows;
    }

    static async getLaporanPaginated(limit, offset, search, filterBulan, filterTahun) {
        let query = 'SELECT * FROM laporan WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND (uraian LIKE ? OR noTransaksi LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (filterBulan) {
            query += ' AND bulan = ?';
            params.push(filterBulan);
        }

        if (filterTahun) {
            query += ' AND tahun = ?';
            params.push(filterTahun);
        }

        query += ' ORDER BY tanggal ASC, id ASC LIMIT ? OFFSET ?';
        params.push(limit.toString(), offset.toString());

        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async getTotalLaporan(search, filterBulan, filterTahun) {
        let query = 'SELECT COUNT(*) as total FROM laporan WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND (uraian LIKE ? OR noTransaksi LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (filterBulan) {
            query += ' AND bulan = ?';
            params.push(filterBulan);
        }

        if (filterTahun) {
            query += ' AND tahun = ?';
            params.push(filterTahun);
        }

        const [rows] = await db.execute(query, params);
        return rows[0].total;
    }

    static async getSaldoAwalLaporan(filterBulan, filterTahun) {
        const query = `
            SELECT SUM(pemasukan - pengeluaran) as saldoAwal 
            FROM laporan 
            WHERE (tahun < ?) OR (tahun = ? AND bulan < ?)
        `;
        const [rows] = await db.execute(query, [filterTahun, filterTahun, filterBulan]);
        return rows[0].saldoAwal || 0;
    }

    static async getLaporanByNoTransaksi(noTransaksi) {
        const [rows] = await db.execute('SELECT * FROM laporan WHERE noTransaksi = ?', [noTransaksi]);
        return rows[0];
    }

    static async addLaporan(data) {
        const query = `
            INSERT INTO laporan (
                tanggal, bulan, tahun, noTransaksi, uraian, pemasukan, pengeluaran
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            data.tanggal !== undefined ? data.tanggal : null,
            data.bulan !== undefined ? data.bulan : null,
            data.tahun !== undefined ? data.tahun : null,
            data.noTransaksi !== undefined ? data.noTransaksi : null,
            data.uraian !== undefined ? data.uraian : null,
            data.pemasukan !== undefined ? data.pemasukan : 0,
            data.pengeluaran !== undefined ? data.pengeluaran : 0
        ];
        const [result] = await db.execute(query, values);
        return result.insertId;
    }

    static async updateLaporanByNoTransaksi(noTransaksi, data) {
        const query = `
            UPDATE laporan SET 
                tanggal = COALESCE(?, tanggal),
                bulan = COALESCE(?, bulan),
                tahun = COALESCE(?, tahun),
                uraian = COALESCE(?, uraian),
                pemasukan = COALESCE(?, pemasukan),
                pengeluaran = COALESCE(?, pengeluaran)
            WHERE noTransaksi = ?
        `;
        const values = [
            data.tanggal !== undefined ? data.tanggal : null,
            data.bulan !== undefined ? data.bulan : null,
            data.tahun !== undefined ? data.tahun : null,
            data.uraian !== undefined ? data.uraian : null,
            data.pemasukan !== undefined ? data.pemasukan : null,
            data.pengeluaran !== undefined ? data.pengeluaran : null,
            noTransaksi
        ];
        await db.execute(query, values);
    }

    static async deleteLaporanByNoTransaksi(noTransaksi) {
        await db.execute('DELETE FROM laporan WHERE noTransaksi = ?', [noTransaksi]);
    }

    // ---- Dashboard Aggregations (Untuk Kinerja SQL yang Optimal) ----
    
    // Total Pemasukan Global (Semua Transaksi Jenis Pemasukan / Inflows)
    static async getTotalPemasukanGlobal(filterTanggal) {
        let query = 'SELECT SUM(nominal) as total FROM transaksi WHERE jenis != "Pengeluaran"';
        let params = [];
        if (filterTanggal && filterTanggal.start && filterTanggal.end) {
            query += ' AND tanggal BETWEEN ? AND ?';
            params.push(filterTanggal.start, filterTanggal.end);
        }
        const [rows] = await db.execute(query, params);
        return parseInt(rows[0].total) || 0;
    }

    // Realisasi Ziswaf (Pemasukan yang namaSantri atau uraian mengandung kata 'ziswaf')
    static async getRealisasiZiswafGlobal(filterTanggal) {
        let query = `
            SELECT SUM(nominal) as total 
            FROM transaksi 
            WHERE jenis = 'Pemasukan' 
            AND LOWER(namaSantri) LIKE '%ziswaf%'
        `;
        let params = [];
        if (filterTanggal && filterTanggal.start && filterTanggal.end) {
            query += ' AND tanggal BETWEEN ? AND ?';
            params.push(filterTanggal.start, filterTanggal.end);
        }
        const [rows] = await db.execute(query, params);
        return parseInt(rows[0].total) || 0;
    }

    // Mendapatkan realisasi Ziswaf per satuan pendidikan (PAUDQu, TPQ, MDT), dipisah Baru dan Lama
    static async getRealisasiZiswafByUnit(satuanPendidikan, isBaru, filterTanggal) {
        let query = `
            SELECT SUM(nominal) as total 
            FROM transaksi 
            WHERE jenis = 'Pemasukan' 
            AND satuanPendidikan = ? 
            AND LOWER(namaSantri) LIKE '%ziswaf%'
        `;
        let params = [satuanPendidikan];
        
        if (isBaru) {
            // Baru: TIDAK mengandung kata daftar ulang, lama, du
            query += ` AND LOWER(namaSantri) NOT LIKE '%daftar ulang%' 
                       AND LOWER(namaSantri) NOT LIKE '%lama%' 
                       AND LOWER(namaSantri) NOT LIKE '%du%'`;
        } else {
            // Lama: Mengandung kata daftar ulang, lama, du
            query += ` AND (LOWER(namaSantri) LIKE '%daftar ulang%' 
                       OR LOWER(namaSantri) LIKE '%lama%' 
                       OR LOWER(namaSantri) LIKE '%du%')`;
        }

        if (filterTanggal && filterTanggal.start && filterTanggal.end) {
            query += ' AND tanggal BETWEEN ? AND ?';
            params.push(filterTanggal.start, filterTanggal.end);
        }

        const [rows] = await db.execute(query, params);
        return parseInt(rows[0].total) || 0;
    }

    // Mendapatkan realisasi Bayar non-Ziswaf per satuan pendidikan, dipisah Baru dan Lama
    static async getRealisasiBayarByUnit(satuanPendidikan, isBaru, filterTanggal) {
        let query = `
            SELECT SUM(nominal) as total 
            FROM transaksi 
            WHERE satuanPendidikan = ?
        `;
        let params = [satuanPendidikan];
        
        if (isBaru) {
            query += ` AND jenis = 'Pembayaran Pendaftaran Baru'`;
        } else {
            query += ` AND jenis = 'Pembayaran Daftar Ulang'`;
        }

        if (filterTanggal && filterTanggal.start && filterTanggal.end) {
            query += ' AND tanggal BETWEEN ? AND ?';
            params.push(filterTanggal.start, filterTanggal.end);
        }

        const [rows] = await db.execute(query, params);
        return parseInt(rows[0].total) || 0;
    }

    // Mendapatkan Pengeluaran per Unit (PAUDQu, TPQ, MDT, MADRASAH)
    static async getPengeluaranRekap(filterTanggal) {
        let query = `
            SELECT satuanPendidikan, SUM(nominal) as total
            FROM transaksi
            WHERE jenis = 'Pengeluaran'
        `;
        let params = [];
        if (filterTanggal && filterTanggal.start && filterTanggal.end) {
            query += ' AND tanggal BETWEEN ? AND ?';
            params.push(filterTanggal.start, filterTanggal.end);
        }
        query += ' GROUP BY satuanPendidikan';
        
        const [rows] = await db.execute(query, params);
        let result = { MADRASAH: 0, PAUDQu: 0, TPQ: 0, MDT: 0, TOTAL: 0 };
        
        rows.forEach(row => {
            let val = parseInt(row.total) || 0;
            if (row.satuanPendidikan === 'PAUDQu') result.PAUDQu += val;
            else if (row.satuanPendidikan === 'TPQ') result.TPQ += val;
            else if (row.satuanPendidikan === 'MDT') result.MDT += val;
            else result.MADRASAH += val;
            
            result.TOTAL += val;
        });
        
        return result;
    }

    // Mendapatkan Pengeluaran per Unit secara spesifik
    static async getPengeluaranByUnit(satuanPendidikan, filterTanggal) {
        let query = `
            SELECT SUM(nominal) as total 
            FROM transaksi 
            WHERE jenis = 'Pengeluaran' 
            AND satuanPendidikan = ?
        `;
        let params = [satuanPendidikan];
        
        if (filterTanggal && filterTanggal.start && filterTanggal.end) {
            query += ' AND tanggal BETWEEN ? AND ?';
            params.push(filterTanggal.start, filterTanggal.end);
        }

        const [rows] = await db.execute(query, params);
        return parseInt(rows[0].total) || 0;
    }
}

module.exports = TransaksiModel;
