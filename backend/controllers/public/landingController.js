const db = require('../../config/db');
const SystemSettingModel = require('../../models/SystemSetting');

// ---- Landing Page and Success ----

exports.getLanding = async (req, res) => {
    try {
        const [jenjang] = await db.execute('SELECT * FROM master_jenjang WHERE status = "Aktif" ORDER BY id ASC');
        const defaultTA = await SystemSettingModel.getDefaultTahunAjaran();
        const year = defaultTA.tahun_mulai || new Date().getFullYear();
        
        for (let j of jenjang) {
            const [countBaru] = await db.execute(`SELECT COUNT(*) as total FROM santri WHERE pendidikan = ? AND nomorPendaftaran LIKE ?`, [j.nama, `SPMB-Daftar.Baru/${year}/%`]);
            const [countUlang] = await db.execute(`SELECT COUNT(*) as total FROM santri_daftar_ulang WHERE lanjutKe = ? AND nomorPendaftaran LIKE ?`, [j.nama, `SPMB-Daftar.Ulang/${year}/%`]);
            const totalPendaftar = countBaru[0].total + countUlang[0].total;
            j.terisi = totalPendaftar;
            j.sisaKuota = j.kuota - totalPendaftar;
            if (j.sisaKuota < 0) j.sisaKuota = 0;
        }

        let activeGelombang = null;
        try {
            const [gelRows] = await db.execute('SELECT * FROM master_gelombang WHERE status = "Aktif" ORDER BY id DESC LIMIT 1');
            if (gelRows.length > 0) activeGelombang = gelRows[0];
        } catch (e) {
            // abaikan jika tabel belum siap
        }

        let jumbotronList = [];
        try {
            const [jbRows] = await db.execute('SELECT * FROM master_jumbotron WHERE status = "Aktif" ORDER BY urutan ASC, id DESC');
            jumbotronList = jbRows;
        } catch (e) {
            jumbotronList = [];
        }

        const jumbotronInterval = parseInt(await SystemSettingModel.getSetting('JUMBOTRON_INTERVAL'), 10) || 5;
        const jumbotronOverlay = parseInt(await SystemSettingModel.getSetting('JUMBOTRON_OVERLAY'), 10) || 65;

        res.render('public/layout', { 
            title: `Pendaftaran SPMB JIC ${defaultTA.nama}`, 
            bodyView: 'landing',
            jenjangList: jenjang,
            tahunAjaranAktif: defaultTA.nama,
            activeGelombang,
            jumbotronList,
            jumbotronInterval,
            jumbotronOverlay
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
