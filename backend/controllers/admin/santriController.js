const SantriModel = require('../../models/SantriModel');
const TagihanModel = require('../../models/TagihanModel');
const TunggakanModel = require('../../models/TunggakanModel');
const TransaksiModel = require('../../models/TransaksiModel');

exports.getSantri = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Menampilkan 10 baris per halaman
        const offset = (page - 1) * limit;

        const search = req.query.search || '';
        const pendidikan = req.query.pendidikan || '';

        const santriData = await SantriModel.getSantriPaginated(limit, offset, search, pendidikan);
        const totalData = await SantriModel.getTotalSantri(search, pendidikan);
        const totalPages = Math.ceil(totalData / limit);

        res.render('santri', { 
            title: 'Data Santri Baru', 
            activePage: 'santri', 
            santri: santriData,
            currentPage: page,
            totalPages: totalPages,
            totalData: totalData,
            searchQuery: search,
            pendidikanQuery: pendidikan
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getSantriDaftarUlang = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const search = req.query.search || '';
        const pendidikan = req.query.pendidikan || '';

        const santriDaftarUlangData = await SantriModel.getSantriDaftarUlangPaginated(limit, offset, search, pendidikan);
        const totalData = await SantriModel.getTotalSantriDaftarUlang(search, pendidikan);
        const totalPages = Math.ceil(totalData / limit);

        res.render('santri-daftar-ulang', { 
            title: 'Data Santri Daftar Ulang', 
            activePage: 'santri-daftar-ulang', 
            santri: santriDaftarUlangData,
            currentPage: page,
            totalPages: totalPages,
            totalData: totalData,
            searchQuery: search,
            pendidikanQuery: pendidikan
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.editSantri = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updatedData = req.body;
        
        const oldSantri = await SantriModel.getSantriById(id);
        if (!oldSantri) return res.status(404).send('Not Found');
        
        if (updatedData.tanggalLahir) {
            const birthDate = new Date(updatedData.tanggalLahir);
            updatedData.usia = 2026 - birthDate.getFullYear();
        }

        await SantriModel.updateSantri(id, updatedData);

        // Calculate tagihan if changes affect it
        let formulir = 100000;
        let uangPangkal = 250000;
        let spp = 150000;
        let seragam = 0;
        let perlengkapan = 0;

        const eduPrefix = updatedData.pendidikan ? updatedData.pendidikan.split(' ')[0] : 'PAUDQu';

        if (eduPrefix === 'PAUDQu') {
            seragam = 800000; perlengkapan = 700000;
        } else if (eduPrefix === 'TPQ') {
            seragam = 750000; perlengkapan = 500000;
        } else if (eduPrefix === 'MDT') {
            seragam = 700000; perlengkapan = 600000;
        } else {
            seragam = 700000; perlengkapan = 600000;
        }

        if (updatedData.jalurPendaftaran === 'Beasiswa Dhuafa') {
            formulir = 0; uangPangkal = 0; spp = 0;
        } else if (updatedData.jalurPendaftaran === 'Beasiswa Yatim/Piatu') {
            formulir = 0; uangPangkal = 0; spp = 0; seragam = 0; perlengkapan = 0;
        } else if (updatedData.jalurPendaftaran === 'Jalur Khusus (Pegawai/Komunitas JIC)' || updatedData.jalurPendaftaran === 'Beasiswa Bersaudara') {
            formulir = 0; uangPangkal = 0;
        }

        const totalTagihan = formulir + uangPangkal + seragam + perlengkapan + spp;

        // update tagihan
        const tagihanData = await TagihanModel.getAllTagihan();
        const tghIdx = tagihanData.findIndex(t => t.nama === oldSantri.nama && t.satuanPendidikan === oldSantri.pendidikan);
        if (tghIdx !== -1) {
            const tgh = tagihanData[tghIdx];
            tgh.nama = updatedData.nama;
            tgh.satuanPendidikan = updatedData.pendidikan;
            tgh.jalur = updatedData.jalurPendaftaran;
            tgh.formulir = formulir;
            tgh.uangPangkal = uangPangkal;
            tgh.perlengkapan = perlengkapan;
            tgh.seragam = seragam;
            tgh.spp = spp;
            tgh.totalTagihan = totalTagihan;
            await TagihanModel.updateTagihan(tgh.id, tgh);
        }

        // update tunggakan
        const tunggakanData = await TunggakanModel.getAllTunggakan();
        const tggIdx = tunggakanData.findIndex(t => t.nama === oldSantri.nama && t.satuanPendidikan === oldSantri.pendidikan);
        if (tggIdx !== -1) {
            const tgg = tunggakanData[tggIdx];
            tgg.nama = updatedData.nama;
            tgg.satuanPendidikan = updatedData.pendidikan;
            tgg.noTelepon = updatedData.teleponAyah;
            tgg.totalTagihan = totalTagihan;
            tgg.sisaBayar = totalTagihan - tgg.totalBayar;
            tgg.status = tgg.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
            await TunggakanModel.updateTunggakan(tgg.id, tgg);
        }

        res.json({ success: true, message: 'Data santri berhasil diperbarui!' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.editSantriDaftarUlang = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updatedData = req.body;
        
        const oldSantri = await SantriModel.getSantriDaftarUlangById(id);
        if (!oldSantri) return res.status(404).send('Not Found');

        if (updatedData.tanggalLahir) {
            const birthDate = new Date(updatedData.tanggalLahir);
            updatedData.usia = 2026 - birthDate.getFullYear();
        }

        await SantriModel.updateSantriDaftarUlang(id, updatedData);

        let formulir = 100000;
        let spp = 150000;
        let uangPangkal = 0;
        let seragam = 0;
        let perlengkapan = 0;

        const prefixDaftarUlang = updatedData.lanjutKe ? updatedData.lanjutKe.split(' ')[0] : 'PAUDQu';
        perlengkapan = prefixDaftarUlang === 'PAUDQu' ? 700000 : 600000;

        if (updatedData.jalurPendaftaran === 'Beasiswa Dhuafa') {
            formulir = 0; spp = 0;
        } else if (updatedData.jalurPendaftaran === 'Beasiswa Yatim/Piatu') {
            formulir = 0; perlengkapan = 0; spp = 0; uangPangkal = 0; seragam = 0;
        }

        const totalTagihan = formulir + uangPangkal + perlengkapan + seragam + spp;

        const tagihanData = await TagihanModel.getAllTagihanDaftarUlang();
        const tghIdx = tagihanData.findIndex(t => t.nama === oldSantri.nama && t.satuanPendidikan === oldSantri.lanjutKe);
        if (tghIdx !== -1) {
            const tgh = tagihanData[tghIdx];
            tgh.nama = updatedData.nama;
            tgh.satuanPendidikan = updatedData.lanjutKe;
            tgh.jalur = updatedData.jalurPendaftaran;
            tgh.formulir = formulir;
            tgh.uangPangkal = uangPangkal;
            tgh.perlengkapan = perlengkapan;
            tgh.seragam = seragam;
            tgh.spp = spp;
            tgh.totalTagihan = totalTagihan;
            await TagihanModel.updateTagihanDaftarUlang(tgh.id, tgh);
        }

        const tunggakanData = await TunggakanModel.getAllTunggakanDaftarUlang();
        const tggIdx = tunggakanData.findIndex(t => t.nama === oldSantri.nama && t.satuanPendidikan === oldSantri.lanjutKe);
        if (tggIdx !== -1) {
            const tgg = tunggakanData[tggIdx];
            tgg.nama = updatedData.nama;
            tgg.satuanPendidikan = updatedData.lanjutKe;
            tgg.noTelepon = updatedData.teleponAyah;
            tgg.totalTagihan = totalTagihan;
            tgg.sisaBayar = totalTagihan - tgg.totalBayar;
            tgg.status = tgg.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
            await TunggakanModel.updateTunggakanDaftarUlang(tgg.id, tgg);
        }

        res.json({ success: true, message: 'Data santri berhasil diperbarui!' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.deleteSantri = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const santri = await SantriModel.getSantriById(id);
        if (santri) {
            await SantriModel.deleteSantri(id);
            // Delete related tagihan
            await TagihanModel.deleteTagihanByNamaAndPendidikan(santri.nama, santri.pendidikan);

            // Delete related tunggakan
            await TunggakanModel.deleteTunggakanByNamaAndPendidikan(santri.nama, santri.pendidikan);

            // Delete related transaksi & laporan
            await TransaksiModel.deleteTransaksiAndLaporanByNamaAndPendidikan(santri.nama, santri.pendidikan);
        }
        res.redirect('/santri');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.deleteSantriDaftarUlang = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const santri = await SantriModel.getSantriDaftarUlangById(id);
        if (santri) {
            await SantriModel.deleteSantriDaftarUlang(id);
            // Delete related tagihan
            await TagihanModel.deleteTagihanDaftarUlangByNamaAndPendidikan(santri.nama, santri.lanjutKe);

            // Delete related tunggakan
            await TunggakanModel.deleteTunggakanDaftarUlangByNamaAndPendidikan(santri.nama, santri.lanjutKe);

            // Delete related transaksi & laporan
            await TransaksiModel.deleteTransaksiAndLaporanByNamaAndPendidikan(santri.nama, santri.lanjutKe);
        }
        res.redirect('/santri-daftar-ulang');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
