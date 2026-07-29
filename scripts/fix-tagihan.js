const db = require('./backend/config/db');
async function fixTagihan() {
    await db.query('UPDATE tagihan SET totalTagihan = formulir + uangPangkal + perlengkapan + seragam + spp');
    await db.query('UPDATE tagihan_daftar_ulang SET totalTagihan = formulir + uangPangkal + perlengkapan + seragam + spp');
    await db.query("UPDATE tunggakan t JOIN tagihan tg ON t.nama = tg.nama AND t.satuanPendidikan = tg.satuanPendidikan SET t.totalTagihan = tg.totalTagihan, t.sisaBayar = tg.totalTagihan - t.totalBayar, t.status = IF(tg.totalTagihan - t.totalBayar <= 0, 'Lunas', 'Belum Lunas')");
    await db.query("UPDATE tunggakan_daftar_ulang t JOIN tagihan_daftar_ulang tg ON t.nama = tg.nama AND t.satuanPendidikan = tg.satuanPendidikan SET t.totalTagihan = tg.totalTagihan, t.sisaBayar = tg.totalTagihan - t.totalBayar, t.status = IF(tg.totalTagihan - t.totalBayar <= 0, 'Lunas', 'Belum Lunas')");
    console.log('Fixed');
    process.exit();
}
fixTagihan();
