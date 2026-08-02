const db = require('../../config/db');

// ---- Landing Page and Success ----

exports.getLanding = async (req, res) => {
    try {
        const [jenjang] = await db.execute('SELECT * FROM master_jenjang WHERE status = "Aktif" ORDER BY id ASC');
        const year = new Date().getFullYear();
        
        for (let j of jenjang) {
            const [countBaru] = await db.execute(`SELECT COUNT(*) as total FROM santri WHERE pendidikan = ? AND nomorPendaftaran LIKE ?`, [j.nama, `SPMB-Daftar.Baru/${year}/%`]);
            const [countUlang] = await db.execute(`SELECT COUNT(*) as total FROM santri_daftar_ulang WHERE lanjutKe = ? AND nomorPendaftaran LIKE ?`, [j.nama, `SPMB-Daftar.Ulang/${year}/%`]);
            const totalPendaftar = countBaru[0].total + countUlang[0].total;
            j.sisaKuota = j.kuota - totalPendaftar;
            if (j.sisaKuota < 0) j.sisaKuota = 0;
        }

        res.render('public/layout', { 
            title: 'Pendaftaran SPMB JIC 2026', 
            bodyView: 'landing',
            jenjangList: jenjang 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

exports.getSukses = (req, res) => {
    const noRef = req.query.noRef;
    res.render('public/layout', { title: 'Berhasil', bodyView: 'sukses', noRef });
};
