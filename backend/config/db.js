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

        // Migration untuk status_santri di tabel santri & santri_daftar_ulang
        const santriTables = ['santri', 'santri_daftar_ulang'];
        for (const table of santriTables) {
            const [cols] = await poolPromise.query(`SHOW COLUMNS FROM ${table}`);
            const colNames = cols.map(c => c.Field);
            if (!colNames.includes('status_santri')) {
                console.log(`[Migration] Menambahkan kolom 'status_santri' ke tabel '${table}'...`);
                await poolPromise.query(`ALTER TABLE ${table} ADD COLUMN status_santri ENUM('Aktif', 'Mundur') DEFAULT 'Aktif'`);
            }
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

        // ==========================================
        // MIGRATION SUPER ADMIN & MASTER DATA
        // ==========================================
        
        // 1. Tambah kolom role dan is_active ke tabel admin
        const [adminCols] = await poolPromise.query("SHOW COLUMNS FROM admin");
        const existingAdminCols = adminCols.map(c => c.Field);
        
        if (!existingAdminCols.includes('role')) {
            console.log(`[Migration] Menambahkan kolom 'role' ke tabel 'admin'...`);
            await poolPromise.query(`ALTER TABLE admin ADD COLUMN role ENUM('super_admin', 'admin', 'panitia') DEFAULT 'admin'`);
            
            // Set user admin pertama sebagai super_admin sebagai default
            await poolPromise.query(`UPDATE admin SET role = 'super_admin' ORDER BY id ASC LIMIT 1`);
        }
        if (!existingAdminCols.includes('is_active')) {
            console.log(`[Migration] Menambahkan kolom 'is_active' ke tabel 'admin'...`);
            await poolPromise.query(`ALTER TABLE admin ADD COLUMN is_active TINYINT(1) DEFAULT 1`);
        }

        // 2. Buat tabel master_jenjang
        await poolPromise.query(`
            CREATE TABLE IF NOT EXISTS master_jenjang (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama VARCHAR(100),
                kuota INT DEFAULT 0,
                status ENUM('Aktif', 'Nonaktif') DEFAULT 'Aktif',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Buat tabel master_gelombang
        await poolPromise.query(`
            CREATE TABLE IF NOT EXISTS master_gelombang (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama VARCHAR(100),
                tanggal_mulai DATE,
                tanggal_selesai DATE,
                status ENUM('Aktif', 'Nonaktif') DEFAULT 'Aktif',
                buka_pendaftaran_baru TINYINT(1) DEFAULT 1,
                buka_pendaftaran_beasiswa TINYINT(1) DEFAULT 1,
                buka_daftar_ulang TINYINT(1) DEFAULT 1,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. Buat tabel system_settings
        await poolPromise.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                \`key\` VARCHAR(255) NOT NULL UNIQUE,
                \`value\` TEXT NOT NULL
            )
        `);

        // Migration untuk update kolom baru jika tabel sudah ada
        const [gelombangCols] = await poolPromise.query("SHOW COLUMNS FROM master_gelombang");
        const existingGelombangCols = gelombangCols.map(c => c.Field);
        
        if (!existingGelombangCols.includes('buka_pendaftaran_baru')) {
            console.log(`[Migration] Menambahkan kolom 'buka_pendaftaran_baru' ke tabel 'master_gelombang'...`);
            await poolPromise.query(`ALTER TABLE master_gelombang ADD COLUMN buka_pendaftaran_baru TINYINT(1) DEFAULT 1`);
            await poolPromise.query(`ALTER TABLE master_gelombang ADD COLUMN buka_pendaftaran_beasiswa TINYINT(1) DEFAULT 1`);
            await poolPromise.query(`ALTER TABLE master_gelombang ADD COLUMN buka_daftar_ulang TINYINT(1) DEFAULT 1`);
        }

        // 4. Buat tabel master_jalur
        await poolPromise.query(`
            CREATE TABLE IF NOT EXISTS master_jalur (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama VARCHAR(100),
                biaya DECIMAL(15,2) DEFAULT 0,
                syarat_dokumen TEXT,
                status ENUM('Aktif', 'Nonaktif') DEFAULT 'Aktif',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 5. Buat tabel activity_logs
        await poolPromise.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                username VARCHAR(100),
                role VARCHAR(50),
                action VARCHAR(255),
                target_table VARCHAR(100),
                target_id INT,
                details TEXT,
                ip_address VARCHAR(50),
                user_agent TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migration untuk tabel system_settings
        await poolPromise.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                \`key\` VARCHAR(50) NOT NULL UNIQUE,
                \`value\` TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        // Seed default value for TUTUP_BUKU
        await poolPromise.query(`INSERT IGNORE INTO system_settings (\`key\`, \`value\`) VALUES ('TUTUP_BUKU', 'false')`);

        // Jalankan cleanup billing ganda/yatim piatu akibat bug lama
        await cleanupOrphanedBilling();
    } catch (err) {
        console.error('[Migration] Gagal menjalankan auto-migration:', err.message);
    }
}

async function cleanupOrphanedBilling() {
    try {
        console.log('[Migration] Cleaning up duplicate orphaned billing records...');
        
        // 1. Clean up 'tagihan' and 'tunggakan' for Santri Baru
        const [santriCounts] = await poolPromise.query(
            'SELECT nama, pendidikan, COUNT(*) as count FROM santri GROUP BY nama, pendidikan'
        );
        
        for (let s of santriCounts) {
            // Tagihan
            const [tagihans] = await poolPromise.query(
                'SELECT id FROM tagihan WHERE nama = ? AND satuanPendidikan = ? ORDER BY id DESC',
                [s.nama, s.pendidikan]
            );
            if (tagihans.length > s.count) {
                const excess = tagihans.length - s.count;
                const idsToDelete = tagihans.slice(0, excess).map(t => t.id);
                console.log(`[Migration] Deleting ${excess} duplicate tagihan for ${s.nama} (${s.pendidikan})`);
                await poolPromise.query('DELETE FROM tagihan WHERE id IN (?)', [idsToDelete]);
            }
            
            // Tunggakan
            const [tunggakans] = await poolPromise.query(
                'SELECT id FROM tunggakan WHERE nama = ? AND satuanPendidikan = ? ORDER BY id DESC',
                [s.nama, s.pendidikan]
            );
            if (tunggakans.length > s.count) {
                const excess = tunggakans.length - s.count;
                const idsToDelete = tunggakans.slice(0, excess).map(t => t.id);
                console.log(`[Migration] Deleting ${excess} duplicate tunggakan for ${s.nama} (${s.pendidikan})`);
                await poolPromise.query('DELETE FROM tunggakan WHERE id IN (?)', [idsToDelete]);
            }
        }
        
        // 2. Clean up 'tagihan_daftar_ulang' and 'tunggakan_daftar_ulang'
        const [santriDUCounts] = await poolPromise.query(
            'SELECT nama, lanjutKe, COUNT(*) as count FROM santri_daftar_ulang GROUP BY nama, lanjutKe'
        );
        
        for (let s of santriDUCounts) {
            // Tagihan DU
            const [tagihans] = await poolPromise.query(
                'SELECT id FROM tagihan_daftar_ulang WHERE nama = ? AND satuanPendidikan = ? ORDER BY id DESC',
                [s.nama, s.lanjutKe]
            );
            if (tagihans.length > s.count) {
                const excess = tagihans.length - s.count;
                const idsToDelete = tagihans.slice(0, excess).map(t => t.id);
                console.log(`[Migration] Deleting ${excess} duplicate tagihan_daftar_ulang for ${s.nama} (${s.lanjutKe})`);
                await poolPromise.query('DELETE FROM tagihan_daftar_ulang WHERE id IN (?)', [idsToDelete]);
            }
            
            // Tunggakan DU
            const [tunggakans] = await poolPromise.query(
                'SELECT id FROM tunggakan_daftar_ulang WHERE nama = ? AND satuanPendidikan = ? ORDER BY id DESC',
                [s.nama, s.lanjutKe]
            );
            if (tunggakans.length > s.count) {
                const excess = tunggakans.length - s.count;
                const idsToDelete = tunggakans.slice(0, excess).map(t => t.id);
                console.log(`[Migration] Deleting ${excess} duplicate tunggakan_daftar_ulang for ${s.nama} (${s.lanjutKe})`);
                await poolPromise.query('DELETE FROM tunggakan_daftar_ulang WHERE id IN (?)', [idsToDelete]);
            }
        }

        // 3. Clean up orphaned records with no active santri at all
        const [allTagihan] = await poolPromise.query('SELECT DISTINCT nama, satuanPendidikan FROM tagihan');
        for (let t of allTagihan) {
            const [exists] = await poolPromise.query('SELECT COUNT(*) as count FROM santri WHERE nama = ? AND pendidikan = ?', [t.nama, t.satuanPendidikan]);
            if (exists[0].count === 0) {
                console.log(`[Migration] Deleting orphaned tagihan for ${t.nama} (no active santri)`);
                await poolPromise.query('DELETE FROM tagihan WHERE nama = ? AND satuanPendidikan = ?', [t.nama, t.satuanPendidikan]);
            }
        }

        const [allTunggakan] = await poolPromise.query('SELECT DISTINCT nama, satuanPendidikan FROM tunggakan');
        for (let t of allTunggakan) {
            const [exists] = await poolPromise.query('SELECT COUNT(*) as count FROM santri WHERE nama = ? AND pendidikan = ?', [t.nama, t.satuanPendidikan]);
            if (exists[0].count === 0) {
                console.log(`[Migration] Deleting orphaned tunggakan for ${t.nama} (no active santri)`);
                await poolPromise.query('DELETE FROM tunggakan WHERE nama = ? AND satuanPendidikan = ?', [t.nama, t.satuanPendidikan]);
            }
        }

        const [allTagihanDU] = await poolPromise.query('SELECT DISTINCT nama, satuanPendidikan FROM tagihan_daftar_ulang');
        for (let t of allTagihanDU) {
            const [exists] = await poolPromise.query('SELECT COUNT(*) as count FROM santri_daftar_ulang WHERE nama = ? AND lanjutKe = ?', [t.nama, t.satuanPendidikan]);
            if (exists[0].count === 0) {
                console.log(`[Migration] Deleting orphaned tagihan_daftar_ulang for ${t.nama} (no active santri_daftar_ulang)`);
                await poolPromise.query('DELETE FROM tagihan_daftar_ulang WHERE nama = ? AND satuanPendidikan = ?', [t.nama, t.satuanPendidikan]);
            }
        }

        const [allTunggakanDU] = await poolPromise.query('SELECT DISTINCT nama, satuanPendidikan FROM tunggakan_daftar_ulang');
        for (let t of allTunggakanDU) {
            const [exists] = await poolPromise.query('SELECT COUNT(*) as count FROM santri_daftar_ulang WHERE nama = ? AND lanjutKe = ?', [t.nama, t.satuanPendidikan]);
            if (exists[0].count === 0) {
                console.log(`[Migration] Deleting orphaned tunggakan_daftar_ulang for ${t.nama} (no active santri_daftar_ulang)`);
                await poolPromise.query('DELETE FROM tunggakan_daftar_ulang WHERE nama = ? AND satuanPendidikan = ?', [t.nama, t.satuanPendidikan]);
            }
        }

        console.log('[Migration] Cleanup complete!');
    } catch (err) {
        console.error('[Migration] Gagal melakukan cleanup:', err.message);
    }
}

// Jalankan migrasi di latar belakang setelah inisialisasi koneksi
runMigration();

// Gunakan promises agar bisa menggunakan async/await saat query
module.exports = poolPromise;