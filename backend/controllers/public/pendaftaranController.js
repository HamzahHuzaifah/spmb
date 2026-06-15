const SantriModel = require('../../models/SantriModel');
const TagihanModel = require('../../models/TagihanModel');
const TunggakanModel = require('../../models/TunggakanModel');

exports.getFormPendaftaran = (req, res) => {
    res.render('public/layout', { title: 'Form Pendaftaran Baru', bodyView: 'pendaftaran' });
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
        
        const allSantri = await SantriModel.getAllSantri();
        const relatedSantri = allSantri.filter(s => s.nomorPendaftaran && s.nomorPendaftaran.includes(`/${year}/MJIC/`));
        const sequence = String(relatedSantri.length + 1).padStart(3, '0');
        const nomorPendaftaran = `SPMB-Daftar.Baru/${year}/MJIC/${sequence}`;

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

        let formulir = 100000;
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

        if (jalurPendaftaran === 'Jalur Khusus (Pegawai/Komunitas JIC)') {
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
            totalTagihan
        });

        await TunggakanModel.addTunggakan({
            nama: namaSantri,
            satuanPendidikan: pendidikan,
            noTelepon: teleponAyah,
            totalTagihan,
            totalBayar: 0,
            sisaBayar: totalTagihan,
            status: totalTagihan <= 0 ? 'Lunas' : 'Belum Lunas'
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

exports.getFormDaftarUlang = (req, res) => {
    res.render('public/layout', { title: 'Form Daftar Ulang', bodyView: 'pendaftaran-ulang' });
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
        
        const allDaftarUlang = await SantriModel.getAllSantriDaftarUlang();
        const relatedSantri = allDaftarUlang.filter(s => s.nomorPendaftaran && s.nomorPendaftaran.includes(`/${year}/MJIC/`));
        const sequenceDaftarUlang = String(relatedSantri.length + 1).padStart(3, '0');
        const nomorPendaftaran = `SPMB-Daftar.Ulang/${year}/MJIC/${sequenceDaftarUlang}`;

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
        let perlengkapan = prefixDaftarUlang === 'PAUDQu' ? 700000 : 600000;
        let spp = 150000;
        let uangPangkal = 0;
        let seragam = 0;

        if (jalurPendaftaran === 'Beasiswa Dhuafa') {
            formulir = 0;
            spp = 0;
        } else if (jalurPendaftaran === 'Beasiswa Yatim/Piatu') {
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
            totalTagihan
        });

        await TunggakanModel.addTunggakanDaftarUlang({
            nama: namaSantri,
            satuanPendidikan: lanjutKe,
            noTelepon: teleponAyah,
            totalTagihan,
            totalBayar: 0,
            sisaBayar: totalTagihan,
            status: totalTagihan <= 0 ? 'Lunas' : 'Belum Lunas'
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
        const santriData = await SantriModel.getAllSantri();
        res.render('public/layout', { title: 'Form Beasiswa', bodyView: 'beasiswa', santri: santriData });
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
        
        const allSantri = await SantriModel.getAllSantri();
        const relatedSantri = allSantri.filter(s => s.nomorPendaftaran && s.nomorPendaftaran.includes(`/${year}/MJIC/`));
        const sequence = String(relatedSantri.length + 1).padStart(3, '0');
        const nomorPendaftaran = `SPMB-Daftar.Baru/${year}/MJIC/${sequence}`;

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

        if (jalurBeasiswa === 'Beasiswa Dhuafa') {
            formulir = 0;
            uangPangkal = 0;
            spp = 0;
        } else if (jalurBeasiswa === 'Beasiswa Yatim/Piatu') {
            formulir = 0;
            uangPangkal = 0;
            spp = 0;
            seragam = 0;
            perlengkapan = 0;
        } else if (jalurBeasiswa === 'Jalur Khusus (Pegawai/Komunitas JIC)' || jalurBeasiswa === 'Beasiswa Bersaudara') {
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
            totalTagihan
        });

        await TunggakanModel.addTunggakan({
            nama: namaSantri,
            satuanPendidikan: pendidikan,
            noTelepon: teleponAyah,
            totalTagihan,
            totalBayar: 0,
            sisaBayar: totalTagihan,
            status: totalTagihan <= 0 ? 'Lunas' : 'Belum Lunas'
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
