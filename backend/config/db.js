const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const poolPromise = pool.promise();

// Auto-migration untuk menambah kolom baru jika belum ada di cPanel / database
async function backfillTable(table) {
    try {
        if (table === 'tagihan' || table === 'tunggakan') {
            const [santri] = await poolPromise.query('SELECT nama, pendidikan, nomorPendaftaran FROM santri');
            const [records] = await poolPromise.query(`SELECT id, nama, satuanPendidikan FROM ${table} WHERE nomorPendaftaran IS NULL`);
            let usedSantri = new Set();
            for (let r of records) {
                let matchedSantri = santri.find(s => s.nama === r.nama && s.pendidikan === r.satuanPendidikan && !usedSantri.has(s.nomorPendaftaran));
                if (matchedSantri) {
                    await poolPromise.query(`UPDATE ${table} SET nomorPendaftaran = ? WHERE id = ?`, [matchedSantri.nomorPendaftaran, r.id]);
                    usedSantri.add(matchedSantri.nomorPendaftaran);
                }
            }
        } else if (table === 'tagihan_daftar_ulang' || table === 'tunggakan_daftar_ulang') {
            const [santriDU] = await poolPromise.query('SELECT nama, lanjutKe, nomorPendaftaran FROM santri_daftar_ulang');
            const [records] = await poolPromise.query(`SELECT id, nama, satuanPendidikan FROM ${table} WHERE nomorPendaftaran IS NULL`);
            let usedSantriDU = new Set();
            for (let r of records) {
                let matchedSantri = santriDU.find(s => s.nama === r.nama && s.lanjutKe === r.satuanPendidikan && !usedSantriDU.has(s.nomorPendaftaran));
                if (matchedSantri) {
                    await poolPromise.query(`UPDATE ${table} SET nomorPendaftaran = ? WHERE id = ?`, [matchedSantri.nomorPendaftaran, r.id]);
                    usedSantriDU.add(matchedSantri.nomorPendaftaran);
                }
            }
        }
    } catch (err) {
        console.error(`[Migration] Gagal backfill tabel '${table}':`, err.message);
    }
}

async function runMigration() {
    try {
        const [columns] = await poolPromise.query("SHOW COLUMNS FROM transaksi");
        const existingColumns = columns.map(c => c.Field);
        
        const columnsToAdd = [
            { name: 'docTitle', definition: 'VARCHAR(150) NULL' },
            { name: 'diterimaDariPembayaran', definition: 'VARCHAR(150) NULL' },
            { name: 'dibayarkanKepadaSign', definition: 'VARCHAR(150) NULL' },
            { name: 'layoutMarginTop', definition: 'VARCHAR(50) NULL' },
            { name: 'layoutMarginLeft', definition: 'VARCHAR(50) NULL' },
            { name: 'ttdVisible', definition: 'TINYINT(1) DEFAULT 1' },
            { name: 'ttdWidth', definition: 'VARCHAR(50) NULL' },
            { name: 'ttdX', definition: 'INT DEFAULT 0' },
            { name: 'ttdY', definition: 'INT DEFAULT 0' },
            { name: 'rowOrder', definition: 'TEXT NULL' },
            { name: 'inputOleh', definition: 'VARCHAR(150) NULL' }
        ];
        
        for (const col of columnsToAdd) {
            if (!existingColumns.includes(col.name)) {
                console.log(`[Migration] Menambahkan kolom '${col.name}' ke tabel 'transaksi'...`);
                await poolPromise.query(`ALTER TABLE transaksi ADD COLUMN ${col.name} ${col.definition}`);
            }
        }

        // Migration untuk nomorPendaftaran di tabel tagihan & tunggakan
        const tables = ['tagihan', 'tagihan_daftar_ulang', 'tunggakan', 'tunggakan_daftar_ulang'];
        for (const table of tables) {
            const [cols] = await poolPromise.query(`SHOW COLUMNS FROM ${table}`);
            const colNames = cols.map(c => c.Field);
            if (!colNames.includes('nomorPendaftaran')) {
                console.log(`[Migration] Menambahkan kolom 'nomorPendaftaran' ke tabel '${table}'...`);
                await poolPromise.query(`ALTER TABLE ${table} ADD COLUMN nomorPendaftaran VARCHAR(100) AFTER id`);
            }
            // Selalu jalankan backfill untuk mengisi nilai NULL jika ada
            await backfillTable(table);
        }

        // Buat tabel deleted_registrations jika belum ada
        await poolPromise.query(`
            CREATE TABLE IF NOT EXISTS deleted_registrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nomorPendaftaran VARCHAR(100) UNIQUE,
                nama VARCHAR(150),
                nomorPendaftaranAktif VARCHAR(100),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (err) {
        console.error('[Migration] Gagal menjalankan auto-migration:', err.message);
    }
}

// Jalankan migrasi di latar belakang setelah inisialisasi koneksi
runMigration();

// Gunakan promises agar bisa menggunakan async/await saat query
module.exports = poolPromise;