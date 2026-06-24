const db = require('../backend/config/db');

async function run() {
    try {
        const [rows] = await db.execute("SELECT id, tanggal, jenis, nominal, satuanPendidikan, namaSantri FROM transaksi");
        console.log("All transactions:");
        console.log(rows);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
