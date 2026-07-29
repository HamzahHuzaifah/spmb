const SantriModel = require('../../models/SantriModel');
const TagihanModel = require('../../models/TagihanModel');
const xlsx = require('xlsx');
const TunggakanModel = require('../../models/TunggakanModel');
const TransaksiModel = require('../../models/TransaksiModel');

exports.getSantri = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 1000000;
        const offset = 0;

        const search = req.query.search || '';
        const pendidikan = req.query.pendidikan || '';

        const santriData = await SantriModel.getSantriPaginated(limit, offset, search, pendidikan);
        for (const item of santriData) {
            item.isDuplicate = await SantriModel.checkHasDuplicate(item, 'baru');
        }
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
        const limit = 1000000;
        const offset = 0;

        const search = req.query.search || '';
        const pendidikan = req.query.pendidikan || '';

        const santriDaftarUlangData = await SantriModel.getSantriDaftarUlangPaginated(limit, offset, search, pendidikan);
        for (const item of santriDaftarUlangData) {
            item.isDuplicate = await SantriModel.checkHasDuplicate(item, 'daftar_ulang');
        }
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
        
        // Map the frontend form input name to the database schema
        if (updatedData.tingkatPendidikan) {
            updatedData.pendidikan = updatedData.tingkatPendidikan;
        }
        
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
            // Cek apakah ada duplikat aktif sebelum dihapus
            const duplicates = await SantriModel.getSantriDuplicates(santri.nama, santri.pendidikan, id);
            if (duplicates && duplicates.length > 0) {
                // Log nomor pendaftaran yang dihapus dan hubungkan dengan nomor pendaftaran aktif duplikatnya
                const activeNomor = duplicates[0].nomorPendaftaran;
                await SantriModel.logDeletedRegistration(santri.nomorPendaftaran, santri.nama, activeNomor);
            }

            await SantriModel.deleteSantri(id);
            
            // Delete exactly 1 related tagihan, tunggakan, and transaksi
            await TagihanModel.deleteTagihanByNamaAndPendidikan(santri.nama, santri.pendidikan);
            await TunggakanModel.deleteTunggakanByNamaAndPendidikan(santri.nama, santri.pendidikan);
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
            // Cek apakah ada duplikat aktif sebelum dihapus
            const duplicates = await SantriModel.getSantriDaftarUlangDuplicates(santri.nama, santri.lanjutKe, id);
            if (duplicates && duplicates.length > 0) {
                // Log nomor pendaftaran yang dihapus dan hubungkan dengan nomor pendaftaran aktif duplikatnya
                const activeNomor = duplicates[0].nomorPendaftaran;
                await SantriModel.logDeletedRegistration(santri.nomorPendaftaran, santri.nama, activeNomor);
            }

            await SantriModel.deleteSantriDaftarUlang(id);
            
            // Delete exactly 1 related tagihan, tunggakan, and transaksi
            await TagihanModel.deleteTagihanDaftarUlangByNamaAndPendidikan(santri.nama, santri.lanjutKe);
            await TunggakanModel.deleteTunggakanDaftarUlangByNamaAndPendidikan(santri.nama, santri.lanjutKe);
            await TransaksiModel.deleteTransaksiAndLaporanByNamaAndPendidikan(santri.nama, santri.lanjutKe);
        }
        res.redirect('/santri-daftar-ulang');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.exportSantriExcel = async (req, res) => {
    try {
        const search = req.query.search || '';
        const pendidikan = req.query.pendidikan || '';

        const data = await SantriModel.getAllSantriFiltered(search, pendidikan);
        
        const worksheetData = data.map((item, index) => ({
            'No': index + 1,
            'No Pendaftaran': item.nomorPendaftaran,
            'Tanggal Daftar (Timestamp)': item.timestamp,
            'Email': item.email,
            'Jalur Pendaftaran': item.jalurPendaftaran,
            'Nama Lengkap': item.nama ? item.nama.toUpperCase() : '',
            'Nama Panggilan': item.namaPanggilan ? item.namaPanggilan.toUpperCase() : '',
            'Jenis Kelamin': item.jenisKelamin,
            'Pendidikan': item.pendidikan,
            'Tempat Lahir': item.tempatLahir,
            'Tanggal Lahir': item.tanggalLahir,
            'Agama': item.agama,
            'Status Keluarga': item.statusKeluarga,
            'Anak Ke': item.anakKe,
            'Dari Bersaudara': item.dariBersaudara,
            'Asal Sekolah': item.asalSekolah,
            'Usia': item.usia,
            'Nama Ayah': item.namaAyah ? item.namaAyah.toUpperCase() : '',
            'Pekerjaan Ayah': item.pekerjaanAyah,
            'No HP Ayah': item.teleponAyah,
            'Nama Ibu': item.namaIbu ? item.namaIbu.toUpperCase() : '',
            'Pekerjaan Ibu': item.pekerjaanIbu,
            'No HP Ibu': item.teleponIbu,
            'Alamat Lengkap': item.alamat,
            'No Telepon Pendaftar': item.noTelepon
        }));

        const worksheet = xlsx.utils.json_to_sheet(worksheetData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Data Santri Baru');

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="Detail_Data_Santri_Baru.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.exportSantriDaftarUlangExcel = async (req, res) => {
    try {
        const search = req.query.search || '';
        const pendidikan = req.query.pendidikan || '';

        const data = await SantriModel.getAllSantriDaftarUlangFiltered(search, pendidikan);
        
        const worksheetData = data.map((item, index) => ({
            'No': index + 1,
            'No Pendaftaran': item.nomorPendaftaran,
            'Tanggal Daftar (Timestamp)': item.timestamp,
            'Email': item.email,
            'Jalur Pendaftaran': item.jalurPendaftaran,
            'Nama Lengkap': item.nama ? item.nama.toUpperCase() : '',
            'Nama Panggilan': item.namaPanggilan ? item.namaPanggilan.toUpperCase() : '',
            'Jenis Kelamin': item.jenisKelamin,
            'Unit Sebelumnya': item.unitSebelumnya,
            'Lanjut Ke': item.lanjutKe,
            'Tempat Lahir': item.tempatLahir,
            'Tanggal Lahir': item.tanggalLahir,
            'Agama': item.agama,
            'Status Keluarga': item.statusKeluarga,
            'Anak Ke': item.anakKe,
            'Dari Bersaudara': item.dariBersaudara,
            'Asal Sekolah': item.asalSekolah,
            'Usia': item.usia,
            'Nama Ayah': item.namaAyah ? item.namaAyah.toUpperCase() : '',
            'Pekerjaan Ayah': item.pekerjaanAyah,
            'No HP Ayah': item.teleponAyah,
            'Nama Ibu': item.namaIbu ? item.namaIbu.toUpperCase() : '',
            'Pekerjaan Ibu': item.pekerjaanIbu,
            'No HP Ibu': item.teleponIbu,
            'Alamat Lengkap': item.alamat,
            'No Telepon Pendaftar': item.noTelepon
        }));

        const worksheet = xlsx.utils.json_to_sheet(worksheetData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Data Santri Daftar Ulang');

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="Detail_Data_Santri_Daftar_Ulang.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.mundurSantri = async (req, res) => {
    try {
        const id = req.params.id;
        const { alasan, refund } = req.body;
        
        const santri = await SantriModel.getSantriById(id);
        if (!santri) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

        await SantriModel.setStatusSantri(id, 'Mundur');
        
        const tunggakan = await TunggakanModel.getTunggakanByNameAndPendidikan(santri.nama, santri.pendidikan);
        if (tunggakan) {
            await TunggakanModel.voidTunggakanByNamaAndPendidikan(santri.nama, santri.pendidikan);
            
            const nominalRefund = parseInt(refund) || 0;
            if (nominalRefund > 0) {
                const currentDate = new Date();
                const tanggalStr = currentDate.toISOString().split('T')[0];
                const bulanStr = String(currentDate.getMonth() + 1).padStart(2, '0');
                const tahunStr = String(currentDate.getFullYear());
                
                const transaksiTerbaru = await TransaksiModel.getAllTransaksi();
                const count = transaksiTerbaru.filter(t => t.noTransaksi.startsWith('KWI-OUT') && t.noTransaksi.includes(`/${bulanStr}/${tahunStr}`)).length + 1;
                const noTransaksi = `KWI-OUT/${String(count).padStart(3, '0')}/${bulanStr}/${tahunStr}`;
                
                await TransaksiModel.addTransaksi({
                    tanggal: tanggalStr,
                    noTransaksi: noTransaksi,
                    namaSantri: santri.nama,
                    jenis: 'Pengeluaran',
                    nominal: nominalRefund,
                    satuanPendidikan: santri.pendidikan,
                    kategoriDana: 'Pengembalian Dana (Refund Mundur)',
                    diterimaDari: '',
                    namaPemberi: santri.nama,
                    inputOleh: req.session && req.session.user ? req.session.user.username : 'admin'
                });
                
                await TransaksiModel.addLaporan({
                    tanggal: tanggalStr,
                    bulan: bulanStr,
                    tahun: tahunStr,
                    noTransaksi: noTransaksi,
                    uraian: `Pengembalian dana untuk ${santri.nama} (${alasan})`,
                    pemasukan: 0,
                    pengeluaran: nominalRefund
                });
            }
        }
        
        res.json({ success: true, message: 'Status berhasil diubah menjadi Mundur dan tagihan disesuaikan' });
    } catch (err) {
        console.error("Error mundurSantri:", err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

exports.mundurSantriDaftarUlang = async (req, res) => {
    try {
        const id = req.params.id;
        const { alasan, refund } = req.body;
        
        const santri = await SantriModel.getSantriDaftarUlangById(id);
        if (!santri) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

        await SantriModel.setStatusSantriDaftarUlang(id, 'Mundur');
        
        const tunggakan = await TunggakanModel.getTunggakanDaftarUlangByNameAndPendidikan(santri.nama, santri.lanjutKe);
        if (tunggakan) {
            await TunggakanModel.voidTunggakanDaftarUlangByNamaAndPendidikan(santri.nama, santri.lanjutKe);
            
            const nominalRefund = parseInt(refund) || 0;
            if (nominalRefund > 0) {
                const currentDate = new Date();
                const tanggalStr = currentDate.toISOString().split('T')[0];
                const bulanStr = String(currentDate.getMonth() + 1).padStart(2, '0');
                const tahunStr = String(currentDate.getFullYear());
                
                const transaksiTerbaru = await TransaksiModel.getAllTransaksi();
                const count = transaksiTerbaru.filter(t => t.noTransaksi.startsWith('KWI-OUT') && t.noTransaksi.includes(`/${bulanStr}/${tahunStr}`)).length + 1;
                const noTransaksi = `KWI-OUT/${String(count).padStart(3, '0')}/${bulanStr}/${tahunStr}`;
                
                await TransaksiModel.addTransaksi({
                    tanggal: tanggalStr,
                    noTransaksi: noTransaksi,
                    namaSantri: santri.nama,
                    jenis: 'Pengeluaran',
                    nominal: nominalRefund,
                    satuanPendidikan: santri.lanjutKe,
                    kategoriDana: 'Pengembalian Dana (Refund Mundur)',
                    diterimaDari: '',
                    namaPemberi: santri.nama,
                    inputOleh: req.session && req.session.user ? req.session.user.username : 'admin'
                });
                
                await TransaksiModel.addLaporan({
                    tanggal: tanggalStr,
                    bulan: bulanStr,
                    tahun: tahunStr,
                    noTransaksi: noTransaksi,
                    uraian: `Pengembalian dana untuk ${santri.nama} (${alasan})`,
                    pemasukan: 0,
                    pengeluaran: nominalRefund
                });
            }
        }
        
        res.json({ success: true, message: 'Status berhasil diubah menjadi Mundur dan tagihan disesuaikan' });
    } catch (err) {
        console.error("Error mundurSantriDaftarUlang:", err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

exports.undoMundurSantri = async (req, res) => {
    try {
        const id = req.params.id;
        const { option } = req.body;
        
        const santri = await SantriModel.getSantriById(id);
        if (!santri) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

        await SantriModel.setStatusSantri(id, 'Aktif');
        
        if (option === 'mulai_baru') {
            await TunggakanModel.resetTunggakanByNamaAndPendidikan(santri.nama, santri.pendidikan);
        } else if (option === 'lanjutkan') {
            const refundTrx = await TransaksiModel.getRefundTransaksiByNamaAndPendidikan(santri.nama, santri.pendidikan);
            const nominalRefund = refundTrx ? (Number(refundTrx.nominal) || 0) : 0;
            await TunggakanModel.restoreTunggakanByNamaAndPendidikan(santri.nama, santri.pendidikan, nominalRefund);
        }
        
        res.json({ success: true, message: 'Status berhasil dikembalikan menjadi Aktif dan tagihan disesuaikan' });
    } catch (err) {
        console.error("Error undoMundurSantri:", err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

exports.undoMundurSantriDaftarUlang = async (req, res) => {
    try {
        const id = req.params.id;
        const { option } = req.body;
        
        const santri = await SantriModel.getSantriDaftarUlangById(id);
        if (!santri) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

        await SantriModel.setStatusSantriDaftarUlang(id, 'Aktif');
        
        if (option === 'mulai_baru') {
            await TunggakanModel.resetTunggakanDaftarUlangByNamaAndPendidikan(santri.nama, santri.lanjutKe);
        } else if (option === 'lanjutkan') {
            const refundTrx = await TransaksiModel.getRefundTransaksiByNamaAndPendidikan(santri.nama, santri.lanjutKe);
            const nominalRefund = refundTrx ? (Number(refundTrx.nominal) || 0) : 0;
            await TunggakanModel.restoreTunggakanDaftarUlangByNamaAndPendidikan(santri.nama, santri.lanjutKe, nominalRefund);
        }
        
        res.json({ success: true, message: 'Status berhasil dikembalikan menjadi Aktif dan tagihan disesuaikan' });
    } catch (err) {
        console.error("Error undoMundurSantriDaftarUlang:", err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};
