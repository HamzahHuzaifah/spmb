const SantriModel = require('../../models/SantriModel');
const TagihanModel = require('../../models/TagihanModel');
const TunggakanModel = require('../../models/TunggakanModel');
const db = require('../../config/db');

async function getJenjangListWithQuota() {
    const [jenjangList] = await db.execute('SELECT * FROM master_jenjang WHERE status = "Aktif" ORDER BY id ASC');
    const year = new Date().getFullYear();
    for (let j of jenjangList) {
        const [countBaru] = await db.execute(`SELECT COUNT(*) as total FROM santri WHERE pendidikan = ? AND nomorPendaftaran LIKE ?`, [j.nama, `SPMB-Daftar.Baru/${year}/%`]);
        const [countUlang] = await db.execute(`SELECT COUNT(*) as total FROM santri_daftar_ulang WHERE lanjutKe = ? AND nomorPendaftaran LIKE ?`, [j.nama, `SPMB-Daftar.Ulang/${year}/%`]);
        const totalPendaftar = countBaru[0].total + countUlang[0].total;
        j.sisaKuota = j.kuota - totalPendaftar;
        if (j.sisaKuota < 0) j.sisaKuota = 0;
    }
    return jenjangList;
}

exports.getFormPendaftaran = async (req, res) => {
    try {
        const jenjangList = await getJenjangListWithQuota();
        const [jalurList] = await db.execute('SELECT * FROM master_jalur WHERE status = "Aktif"');
        res.render('public/layout', { title: 'Form Pendaftaran Baru', bodyView: 'pendaftaran', jenjangList, jalurList });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.postFormPendaftaran = async (req, res) => {
    try {
        const {
            email, jalurPendaftaran, namaSantri, namaPanggilan, jenisKelamin, pendidikan, tempatLahir, tanggalLahir,
            agama, statusKeluarga, anakKe, dariBersaudara, asalSekolah,
            namaAyah, pekerjaanAyah, teleponAyah, namaIbu, pekerjaanIbu, teleponIbu, alamat
        } = req.body;

        let usia = 0;
        if (tanggalLahir) {
            const birthDate = new Date(tanggalLahir);
            usia = 2026 - birthDate.getFullYear();
        }

        const eduPrefix = pendidikan ? pendidikan.split(' ')[0] : 'PAUDQu';
        const year = new Date().getFullYear();

        // 1. Cek Kuota
        const [jenjangRow] = await db.execute('SELECT kuota FROM master_jenjang WHERE nama = ? AND status = "Aktif"', [pendidikan]);
        if (jenjangRow.length > 0) {
            const kuotaMaksimal = jenjangRow[0].kuota;
            // Hitung pendaftar di jenjang ini secara akumulasi (Baru + Daftar Ulang)
            const [countBaru] = await db.execute(`SELECT COUNT(*) as total FROM santri WHERE pendidikan = ? AND nomorPendaftaran LIKE ?`, [pendidikan, `SPMB-Daftar.Baru/${year}/%`]);
            const [countUlang] = await db.execute(`SELECT COUNT(*) as total FROM santri_daftar_ulang WHERE lanjutKe = ? AND nomorPendaftaran LIKE ?`, [pendidikan, `SPMB-Daftar.Ulang/${year}/%`]);
            const totalPendaftar = countBaru[0].total + countUlang[0].total;

            if (totalPendaftar >= kuotaMaksimal) {
                const jenjangList = await getJenjangListWithQuota();
                const errorMsg = `Mohon maaf, kuota pendaftaran untuk jenjang ${pendidikan} sudah penuh. Silakan pilih jenjang lain atau hubungi panitia.`;
                return res.render('public/layout', {
                    title: 'Form Pendaftaran Baru',
                    bodyView: 'pendaftaran',
                    error: errorMsg,
                    jenjangList
                });
            }
        }

        // Cek duplikasi sebelum menyimpan dengan fuzzy matching
        const existing = await SantriModel.checkDuplicateFuzzy({
            nama: namaSantri,
            tanggalLahir,
            namaAyah,
            email,
            teleponAyah
        }, 'baru');
        if (existing) {
            const jenjangList = await getJenjangListWithQuota();
            const errorMsg = `Pendaftaran gagal. Calon santri dengan nama/kemiripan "${existing.nama}" sudah terdaftar sebelumnya dengan Nomor Pendaftaran: "${existing.nomorPendaftaran}". Silakan gunakan nomor tersebut untuk melakukan info pembayaran atau hubungi admin jika ingin mengubah data.`;
            return res.render('public/layout', {
                title: 'Form Pendaftaran Baru',
                bodyView: 'pendaftaran',
                error: errorMsg,
                jenjangList
            });
        }
        
        const nomorPendaftaran = await SantriModel.getNextNomorPendaftaranBaru(year);

        const newSantriData = {
            nomorPendaftaran,
            timestamp: new Date().toISOString(),
            email,
            jalurPendaftaran: jalurPendaftaran || 'Reguler',
            nama: namaSantri,
            namaPanggilan,
            jenisKelamin,
            pendidikan,
            tempatLahir,
            tanggalLahir,
            agama,
            statusKeluarga,
            anakKe,
            dariBersaudara,
            asalSekolah,
            usia,
            namaAyah,
            pekerjaanAyah,
            teleponAyah,
            namaIbu,
            pekerjaanIbu,
            teleponIbu,
            alamat,
            noTelepon: teleponAyah
        };
        await SantriModel.addSantri(newSantriData);

        let formulir = 100000; // default fallback
        const [jalurRow] = await db.execute('SELECT biaya FROM master_jalur WHERE nama = ? AND status = "Aktif"', [jalurPendaftaran || 'Reguler']);
        if (jalurRow.length > 0) {
            formulir = parseInt(jalurRow[0].biaya) || 0;
        }

        let uangPangkal = 250000;
        let spp = 150000;
        let seragam = 0;
        let perlengkapan = 0;

        if (eduPrefix === 'PAUDQu') {
            seragam = 800000;
            perlengkapan = 700000;
        } else if (eduPrefix === 'TPQ') {
            seragam = 750000;
            perlengkapan = 500000;
        } else if (eduPrefix === 'MDT') {
            seragam = 700000;
            perlengkapan = 600000;
        } else {
            seragam = 700000;
            perlengkapan = 600000;
        }

        if (jalurPendaftaran === 'Jalur Khusus (Pegawai/Komunitas JIC)' || (jalurPendaftaran && jalurPendaftaran.includes('Khusus'))) {
            formulir = 0;
            uangPangkal = 0;
        }

        const totalTagihan = formulir + uangPangkal + seragam + perlengkapan + spp;

        await TagihanModel.addTagihan({
            nama: namaSantri,
            jalur: jalurPendaftaran || 'Reguler',
            satuanPendidikan: pendidikan,
            formulir,
            uangPangkal,
            perlengkapan,
            seragam,
            spp,
            totalTagihan,
            nomorPendaftaran
        });

        await TunggakanModel.addTunggakan({
            nama: namaSantri,
            satuanPendidikan: pendidikan,
            noTelepon: teleponAyah,
            totalTagihan,
            totalBayar: 0,
            sisaBayar: totalTagihan,
            status: totalTagihan <= 0 ? 'Lunas' : 'Belum Lunas',
            nomorPendaftaran
        });

        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            res.json({ success: true, noRef: nomorPendaftaran });
        } else {
            res.redirect(`/daftar/sukses?noRef=${encodeURIComponent(nomorPendaftaran)}`);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getFormDaftarUlang = async (req, res) => {
    try {
        const jenjangList = await getJenjangListWithQuota();
        const [jalurList] = await db.execute('SELECT * FROM master_jalur WHERE status = "Aktif"');
        res.render('public/layout', { title: 'Form Daftar Ulang', bodyView: 'pendaftaran-ulang', jenjangList, jalurList });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.postFormDaftarUlang = async (req, res) => {
    try {
        const {
            email, jalurPendaftaran, namaSantri, namaPanggilan, jenisKelamin, 
            pendidikanSebelumnya, lanjutKe, tempatLahir, tanggalLahir,
            agama, statusKeluarga, anakKe, dariBersaudara, asalSekolah,
            namaAyah, pekerjaanAyah, teleponAyah, namaIbu, pekerjaanIbu, teleponIbu, alamat
        } = req.body;

        let usia = 0;
        if (tanggalLahir) {
            const birthDate = new Date(tanggalLahir);
            usia = 2026 - birthDate.getFullYear();
        }

        const prefixDaftarUlang = lanjutKe ? lanjutKe.split(' ')[0] : 'PAUDQu';
        const year = new Date().getFullYear();

        // 1. (Dihapus) Cek Kuota - Santri Daftar Ulang tidak lagi dibatasi oleh kuota santri baru

        // Cek duplikasi sebelum menyimpan dengan fuzzy matching
        const existing = await SantriModel.checkDuplicateFuzzy({
            nama: namaSantri,
            tanggalLahir,
            namaAyah,
            email,
            teleponAyah
        }, 'daftar_ulang');
        if (existing) {
            const jenjangList = await getJenjangListWithQuota();
            const errorMsg = `Pendaftaran gagal. Calon santri dengan nama/kemiripan "${existing.nama}" sudah terdaftar dalam Daftar Ulang sebelumnya dengan Nomor Pendaftaran: "${existing.nomorPendaftaran}". Silakan gunakan nomor tersebut untuk melakukan info pembayaran atau hubungi admin jika ingin mengubah data.`;
            return res.render('public/layout', {
                title: 'Form Daftar Ulang',
                bodyView: 'pendaftaran-ulang',
                error: errorMsg,
                jenjangList
            });
        }
        
        const nomorPendaftaran = await SantriModel.getNextNomorPendaftaranUlang(year);

        await SantriModel.addSantriDaftarUlang({
            nomorPendaftaran,
            timestamp: new Date().toISOString(),
            email,
            jalurPendaftaran: jalurPendaftaran || 'Reguler',
            nama: namaSantri,
            namaPanggilan,
            jenisKelamin,
            unitSebelumnya: pendidikanSebelumnya,
            lanjutKe,
            tempatLahir,
            tanggalLahir,
            agama,
            statusKeluarga,
            anakKe,
            dariBersaudara,
            asalSekolah,
            usia,
            namaAyah,
            pekerjaanAyah,
            teleponAyah,
            namaIbu,
            pekerjaanIbu,
            teleponIbu,
            alamat,
            noTelepon: teleponAyah
        });

        let formulir = 100000;
        const [jalurRow] = await db.execute('SELECT biaya FROM master_jalur WHERE nama = ? AND status = "Aktif"', [jalurPendaftaran || 'Reguler']);
        if (jalurRow.length > 0) {
            formulir = parseInt(jalurRow[0].biaya) || 0;
        }

        let perlengkapan = prefixDaftarUlang === 'PAUDQu' ? 700000 : 600000;
        let spp = 150000;
        let uangPangkal = 0;
        let seragam = 0;

        if (jalurPendaftaran === 'Beasiswa Dhuafa' || (jalurPendaftaran && jalurPendaftaran.includes('Dhuafa'))) {
            formulir = 0;
            spp = 0;
        } else if (jalurPendaftaran === 'Beasiswa Yatim/Piatu' || (jalurPendaftaran && jalurPendaftaran.includes('Yatim'))) {
            formulir = 0;
            perlengkapan = 0;
            spp = 0;
            uangPangkal = 0;
            seragam = 0;
        }

        const totalTagihan = formulir + uangPangkal + perlengkapan + seragam + spp;

        await TagihanModel.addTagihanDaftarUlang({
            nama: namaSantri,
            jalur: jalurPendaftaran || 'Reguler',
            satuanPendidikanSebelumnya: pendidikanSebelumnya,
            satuanPendidikan: lanjutKe,
            formulir,
            uangPangkal,
            perlengkapan,
            seragam,
            spp,
            totalTagihan,
            nomorPendaftaran
        });

        await TunggakanModel.addTunggakanDaftarUlang({
            nama: namaSantri,
            satuanPendidikan: lanjutKe,
            noTelepon: teleponAyah,
            totalTagihan,
            totalBayar: 0,
            sisaBayar: totalTagihan,
            status: totalTagihan <= 0 ? 'Lunas' : 'Belum Lunas',
            nomorPendaftaran
        });

        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            res.json({ success: true, noRef: nomorPendaftaran });
        } else {
            res.redirect(`/daftar/sukses?noRef=${encodeURIComponent(nomorPendaftaran)}`);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getFormBeasiswa = async (req, res) => {
    try {
        const jenjangList = await getJenjangListWithQuota();
        const [jalurList] = await db.execute('SELECT * FROM master_jalur WHERE status = "Aktif"');
        res.render('public/layout', { title: 'Form Beasiswa', bodyView: 'beasiswa', jenjangList, jalurList });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.postFormBeasiswa = async (req, res) => {
    try {
        const {
            jalurBeasiswa,
            email, namaSantri, namaPanggilan, jenisKelamin, pendidikan, tempatLahir, tanggalLahir,
            agama, statusKeluarga, anakKe, dariBersaudara, asalSekolah,
            namaAyah, pekerjaanAyah, teleponAyah, namaIbu, pekerjaanIbu, teleponIbu, alamat
        } = req.body;

        let usia = 0;
        if (tanggalLahir) {
            const birthDate = new Date(tanggalLahir);
            usia = 2026 - birthDate.getFullYear();
        }

        const eduPrefix = pendidikan ? pendidikan.split(' ')[0] : 'PAUDQu';
        const year = new Date().getFullYear();

        // 1. Cek Kuota
        const [jenjangRow] = await db.execute('SELECT kuota FROM master_jenjang WHERE nama = ? AND status = "Aktif"', [pendidikan]);
        if (jenjangRow.length > 0) {
            const kuotaMaksimal = jenjangRow[0].kuota;
            // Hitung pendaftar di jenjang ini secara akumulasi (Baru + Daftar Ulang)
            const [countBaru] = await db.execute(`SELECT COUNT(*) as total FROM santri WHERE pendidikan = ? AND nomorPendaftaran LIKE ?`, [pendidikan, `SPMB-Daftar.Baru/${year}/%`]);
            const [countUlang] = await db.execute(`SELECT COUNT(*) as total FROM santri_daftar_ulang WHERE lanjutKe = ? AND nomorPendaftaran LIKE ?`, [pendidikan, `SPMB-Daftar.Ulang/${year}/%`]);
            const totalPendaftar = countBaru[0].total + countUlang[0].total;

            if (totalPendaftar >= kuotaMaksimal) {
                const jenjangList = await getJenjangListWithQuota();
                const errorMsg = `Mohon maaf, kuota beasiswa untuk jenjang ${pendidikan} sudah penuh. Silakan pilih jenjang lain atau hubungi panitia.`;
                return res.render('public/layout', {
                    title: 'Form Beasiswa',
                    bodyView: 'beasiswa',
                    error: errorMsg,
                    jenjangList
                });
            }
        }

        // Cek duplikasi sebelum menyimpan dengan fuzzy matching
        const existing = await SantriModel.checkDuplicateFuzzy({
            nama: namaSantri,
            tanggalLahir,
            namaAyah,
            email,
            teleponAyah
        }, 'baru');
        if (existing) {
            const jenjangList = await getJenjangListWithQuota();
            const errorMsg = `Pendaftaran gagal. Calon santri dengan nama/kemiripan "${existing.nama}" sudah terdaftar sebelumnya dengan Nomor Pendaftaran: "${existing.nomorPendaftaran}". Silakan gunakan nomor tersebut untuk melakukan info pembayaran atau hubungi admin jika ingin mengubah data.`;
            return res.render('public/layout', {
                title: 'Form Beasiswa',
                bodyView: 'beasiswa',
                error: errorMsg,
                jenjangList
            });
        }
        
        const nomorPendaftaran = await SantriModel.getNextNomorPendaftaranBaru(year);

        await SantriModel.addSantri({
            nomorPendaftaran,
            timestamp: new Date().toISOString(),
            email,
            jalurPendaftaran: jalurBeasiswa,
            nama: namaSantri,
            namaPanggilan,
            jenisKelamin,
            pendidikan,
            tempatLahir,
            tanggalLahir,
            agama,
            statusKeluarga,
            anakKe,
            dariBersaudara,
            asalSekolah,
            usia,
            namaAyah,
            pekerjaanAyah,
            teleponAyah,
            namaIbu,
            pekerjaanIbu,
            teleponIbu,
            alamat,
            noTelepon: teleponAyah
        });

        let formulir = 100000;
        const [jalurRow] = await db.execute('SELECT biaya FROM master_jalur WHERE nama = ? AND status = "Aktif"', [jalurBeasiswa]);
        if (jalurRow.length > 0) {
            formulir = parseInt(jalurRow[0].biaya) || 0;
        }

        let uangPangkal = 250000;
        let spp = 150000;
        let seragam = 0;
        let perlengkapan = 0;

        if (eduPrefix === 'PAUDQu') {
            seragam = 800000;
            perlengkapan = 700000;
        } else if (eduPrefix === 'TPQ') {
            seragam = 750000;
            perlengkapan = 500000;
        } else if (eduPrefix === 'MDT') {
            seragam = 700000;
            perlengkapan = 600000;
        } else {
            seragam = 700000;
            perlengkapan = 600000;
        }

        if (jalurBeasiswa === 'Beasiswa Dhuafa' || (jalurBeasiswa && jalurBeasiswa.includes('Dhuafa'))) {
            formulir = 0;
            uangPangkal = 0;
            spp = 0;
        } else if (jalurBeasiswa === 'Beasiswa Yatim/Piatu' || (jalurBeasiswa && jalurBeasiswa.includes('Yatim'))) {
            formulir = 0;
            uangPangkal = 0;
            spp = 0;
            seragam = 0;
            perlengkapan = 0;
        } else if (jalurBeasiswa === 'Jalur Khusus (Pegawai/Komunitas JIC)' || jalurBeasiswa === 'Beasiswa Bersaudara' || (jalurBeasiswa && jalurBeasiswa.includes('Khusus'))) {
            formulir = 0;
            uangPangkal = 0;
        }

        const totalTagihan = formulir + uangPangkal + seragam + perlengkapan + spp;

        await TagihanModel.addTagihan({
            nama: namaSantri,
            jalur: jalurBeasiswa,
            satuanPendidikan: pendidikan,
            formulir,
            uangPangkal,
            perlengkapan,
            seragam,
            spp,
            totalTagihan,
            nomorPendaftaran
        });

        await TunggakanModel.addTunggakan({
            nama: namaSantri,
            satuanPendidikan: pendidikan,
            noTelepon: teleponAyah,
            totalTagihan,
            totalBayar: 0,
            sisaBayar: totalTagihan,
            status: totalTagihan <= 0 ? 'Lunas' : 'Belum Lunas',
            nomorPendaftaran
        });

        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            res.json({ success: true, noRef: nomorPendaftaran });
        } else {
            res.redirect(`/daftar/sukses?noRef=${encodeURIComponent(nomorPendaftaran)}`);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
