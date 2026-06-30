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
            { name: 'rowOrder', definition: 'TEXT NULL' }
        ];
        
        for (const col of columnsToAdd) {
            if (!existingColumns.includes(col.name)) {
                console.log(`[Migration] Menambahkan kolom '${col.name}' ke tabel 'transaksi'...`);
                await poolPromise.query(`ALTER TABLE transaksi ADD COLUMN ${col.name} ${col.definition}`);
            }
        }
    } catch (err) {
        console.error('[Migration] Gagal menjalankan auto-migration:', err.message);
    }
}

// Jalankan migrasi di latar belakang setelah inisialisasi koneksi
runMigration();

// Gunakan promises agar bisa menggunakan async/await saat query
module.exports = poolPromise;