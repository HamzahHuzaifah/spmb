// ==========================================
// Public Controller
// Handler untuk pendaftaran publik (daftar, daftar-ulang, beasiswa, sukses)
// ==========================================

const {
    santriData,
    santriDaftarUlangData,
    tagihanData,
    tagihanDaftarUlangData,
    tunggakanData,
    tunggakanDaftarUlangData
} = require('../data/mockData');

// ---- Landing Page ----
exports.getLandingPage = (req, res) => {
    res.render('public/layout', { title: 'Beranda', bodyView: 'landing' });
};

// ---- Form Reguler ----
exports.getFormReguler = (req, res) => {
    res.render('public/layout', { title: 'Form Reguler', bodyView: 'pendaftaran' });
};

exports.postFormReguler = (req, res) => {
    const {
        email, namaSantri, namaPanggilan, jenisKelamin, pendidikan, tempatLahir, tanggalLahir,
        agama, statusKeluarga, anakKe, dariBersaudara, asalSekolah,
        namaAyah, pekerjaanAyah, teleponAyah, namaIbu, pekerjaanIbu, teleponIbu, alamat
    } = req.body;

    // Hitung Usia per Juli 2026
    let usia = 0;
    if (tanggalLahir) {
        const birthDate = new Date(tanggalLahir);
        usia = 2026 - birthDate.getFullYear();
    }

    const eduPrefix = pendidikan ? pendidikan.split(' ')[0] : 'PAUDQu';
    const year = new Date().getFullYear();
    const relatedSantri = santriData.filter(s => s.nomorPendaftaran && s.nomorPendaftaran.includes(`/${year}/MJIC/`));
    const sequence = String(relatedSantri.length + 1).padStart(3, '0');
    const nomorPendaftaran = `SPMB-Daftar.Baru/${year}/MJIC/${sequence}`;

    const newSantri = {
        id: santriData.length > 0 ? Math.max(...santriData.map(s => s.id)) + 1 : 1,
        nomorPendaftaran,
        timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        email,
        jalurPendaftaran: 'Reguler',
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
        noTelepon: teleponAyah // Default ke telepon ayah
    };
    santriData.push(newSantri);

    // Hitung Tagihan Regular
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

    const totalTagihan = formulir + uangPangkal + seragam + perlengkapan + spp;

    tagihanData.push({
        id: tagihanData.length > 0 ? Math.max(...tagihanData.map(t => t.id || 0)) + 1 : 1,
        nama: namaSantri,
        jalur: 'Regular',
        satuanPendidikan: pendidikan,
        formulir,
        uangPangkal,
        perlengkapan,
        seragam,
        spp,
        totalTagihan
    });

    tunggakanData.push({
        nama: namaSantri,
        satuanPendidikan: pendidikan,
        noTelepon: teleponAyah,
        totalTagihan,
        totalBayar: 0,
        sisaBayar: totalTagihan,
        status: totalTagihan <= 0 ? 'Lunas' : 'Belum Lunas'
    });

    // AJAX: return JSON if request expects JSON, otherwise redirect
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        res.json({ success: true, noRef: nomorPendaftaran });
    } else {
        res.redirect(`/daftar/sukses?noRef=${encodeURIComponent(nomorPendaftaran)}`);
    }
};

// ---- Form Daftar Ulang ----
exports.getFormDaftarUlang = (req, res) => {
    res.render('public/layout', { title: 'Form Daftar Ulang', bodyView: 'pendaftaran-ulang' });
};

exports.postFormDaftarUlang = (req, res) => {
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
    const relatedSantriDaftarUlang = santriDaftarUlangData.filter(s => s.nomorPendaftaran && s.nomorPendaftaran.includes(`/${year}/MJIC/`));
    const sequenceDaftarUlang = String(relatedSantriDaftarUlang.length + 1).padStart(3, '0');
    const nomorPendaftaran = `SPMB-Daftar.Ulang/${year}/MJIC/${sequenceDaftarUlang}`;

    const newSantriDaftarUlang = {
        id: santriDaftarUlangData.length > 0 ? Math.max(...santriDaftarUlangData.map(s => s.id)) + 1 : 1,
        nomorPendaftaran,
        timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        email,
        jalurPendaftaran,
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
    };
    santriDaftarUlangData.push(newSantriDaftarUlang);

    let formulir = 100000;
    let perlengkapan = prefixDaftarUlang === 'PAUDQu' ? 700000 : 600000;
    let spp = 150000;
    let uangPangkal = 0;
    let seragam = 0;

    // Diskon Beasiswa
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

    tagihanDaftarUlangData.push({
        id: tagihanDaftarUlangData.length > 0 ? Math.max(...tagihanDaftarUlangData.map(t => t.id || 0)) + 1 : 1,
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

    tunggakanDaftarUlangData.push({
        nama: namaSantri,
        satuanPendidikan: lanjutKe,
        noTelepon: teleponAyah,
        totalTagihan,
        totalBayar: 0,
        sisaBayar: totalTagihan,
        status: totalTagihan <= 0 ? 'Lunas' : 'Belum Lunas'
    });

    // AJAX: return JSON if request expects JSON, otherwise redirect
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        res.json({ success: true, noRef: nomorPendaftaran });
    } else {
        res.redirect(`/daftar/sukses?noRef=${encodeURIComponent(nomorPendaftaran)}`);
    }
};

// ---- Form Beasiswa ----
exports.getFormBeasiswa = (req, res) => {
    res.render('public/layout', { title: 'Form Beasiswa', bodyView: 'beasiswa', santri: santriData });
};

exports.postFormBeasiswa = (req, res) => {
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
    const relatedSantri = santriData.filter(s => s.nomorPendaftaran && s.nomorPendaftaran.includes(`/${year}/MJIC/`));
    const sequence = String(relatedSantri.length + 1).padStart(3, '0');
    const nomorPendaftaran = `SPMB-Daftar.Baru/${year}/MJIC/${sequence}`;

    const newSantri = {
        id: santriData.length > 0 ? Math.max(...santriData.map(s => s.id)) + 1 : 1,
        nomorPendaftaran,
        timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
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
    };
    santriData.push(newSantri);

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
    } else if (jalurBeasiswa === 'Beasiswa Pegawai/Komunitas JIC' || jalurBeasiswa === 'Beasiswa Satu Keluarga') {
        formulir = 0;
        uangPangkal = 0;
    }

    const totalTagihan = formulir + uangPangkal + seragam + perlengkapan + spp;

    tagihanData.push({
        id: tagihanData.length > 0 ? Math.max(...tagihanData.map(t => t.id || 0)) + 1 : 1,
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

    tunggakanData.push({
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
};

// ---- Sukses ----
exports.getSukses = (req, res) => {
    const noRef = req.query.noRef;
    res.render('public/layout', { title: 'Berhasil', bodyView: 'sukses', noRef });
};
