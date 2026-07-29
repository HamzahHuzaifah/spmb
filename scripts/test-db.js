const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('--- MENCOBA KONEKSI DATABASE ---');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_NAME);
console.log('Panjang Password:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);

async function test() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('\n STATUS: KONEKSI BERHASIL! 🟢');
        const [rows] = await connection.execute('SELECT 1 + 1 AS result');
        console.log('Hasil query test:', rows);
        await connection.end();
    } catch (err) {
        console.log('\n STATUS: KONEKSI GAGAL! 🔴');
        console.error('Pesan Error Lengkap:');
        console.error(err);
    }
}

test();
