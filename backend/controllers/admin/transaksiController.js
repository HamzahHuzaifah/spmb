const TransaksiModel = require('../../models/TransaksiModel');
const SantriModel = require('../../models/SantriModel');
const TunggakanModel = require('../../models/TunggakanModel');

exports.getInputTransaksi = async (req, res) => {
    try {
        const success = req.query.success === 'true';
        const error = req.query.error;
        
        // Paginasi tabel transaksi terbaru
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const search = req.query.search || '';
        const filterTanggal = {
            start: req.query.startDate || '',
            end: req.query.endDate || ''
        };
        const filterPendidikan = req.query.pendidikan || '';

        const transaksiTerbaru = await TransaksiModel.getTransaksiPaginated(limit, offset, search, filterTanggal, filterPendidikan);
        const totalData = await TransaksiModel.getTotalTransaksi(search, filterTanggal, filterPendidikan);
        const totalPages = Math.ceil(totalData / limit);

        // KITA HAPUS getAllSantri dan getAllTunggakan agar memori aman
        // Data akan diload melalui AJAX di view input-transaksi.ejs

        res.render('input-transaksi', {
            title: 'Input Transaksi',
            activePage: 'input-transaksi',
            success,
            error,
            data: { transaksiTerbaru },
            currentPage: page,
            totalPages: totalPages,
            totalData: totalData,
            searchQuery: search,
            startDateQuery: filterTanggal.start,
            endDateQuery: filterTanggal.end,
            pendidikanQuery: filterPendidikan
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Endpoint AJAX untuk Auto-Complete
exports.apiSearchTunggakan = async (req, res) => {
    try {
        const { tipe, q, satuanPendidikan } = req.query; // tipe: 'baru' atau 'daftar_ulang'
        const limit = 20; // Batasi 20 hasil pencarian dropdown

        if (!satuanPendidikan) {
            return res.json({ success: true, data: [] });
        }

        let results = [];
        if (tipe === 'baru') {
            results = await TunggakanModel.searchTunggakanBaruAJAX(q, limit, satuanPendidikan);
        } else if (tipe === 'daftar_ulang') {
            results = await TunggakanModel.searchTunggakanDaftarUlangAJAX(q, limit, satuanPendidikan);
        }

        res.json({ success: true, data: results });
    } catch (err) {
        console.error("Error AJAX Search Tunggakan:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.postInputTransaksi = async (req, res) => {
    try {
        const {
            jenisTransaksi, tanggal,
            satuanPendidikan, namaSantriBaru,
            satuanPendidikanDaftarUlang, namaSantriDaftarUlang,
            satuanPendidikanPengeluaran, uraianLain,
            diterimaDari, namaPemberi,
            dibayarkanKepada, kategoriDana, kategoriDanaLainnya,
            rincianNames: reqRincianNames, rincianNominals: reqRincianNominals,
            nominal: reqNominal, metodePembayaran
        } = req.body;

        const dateStr = tanggal || new Date().toISOString().split('T')[0];

        let prefix = '';
        let nama = '';
        let uraian = '';
        let nominal = parseInt(reqNominal) || 0;
        let satuanPend = '';
        let rincianNames = [];
        let rincianNominals = [];

        // Rincian (hanya untuk pengeluaran biasanya, jika dikirim)
        if (reqRincianNames && reqRincianNominals) {
            let nArray = Array.isArray(reqRincianNames) ? reqRincianNames : [reqRincianNames];
            let vArray = Array.isArray(reqRincianNominals) ? reqRincianNominals : [reqRincianNominals];
            for (let i = 0; i < nArray.length; i++) {
                if (nArray[i]) {
                    rincianNames.push(nArray[i]);
                    rincianNominals.push(parseInt(vArray[i]) || 0);
                }
            }
        }

        const katDana = kategoriDana === 'Lainnya' ? kategoriDanaLainnya : kategoriDana;

        if (jenisTransaksi === 'Pembayaran Pendaftaran Baru') {
            prefix = 'KWI-DB';
            nama = namaSantriBaru;
            satuanPend = satuanPendidikan;
            uraian = `Pembayaran Pendaftaran Baru - ${nama}`;
            
            // Update tunggakan
            const tgg = await TunggakanModel.getTunggakanByNameAndPendidikan(nama, satuanPend);
            if (tgg) {
                tgg.totalBayar += nominal;
                tgg.sisaBayar = tgg.totalTagihan - tgg.totalBayar;
                tgg.status = tgg.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
                await TunggakanModel.updateTunggakan(tgg.id, tgg);
            }

        } else if (jenisTransaksi === 'Pembayaran Daftar Ulang') {
            prefix = 'KWI-DU';
            nama = namaSantriDaftarUlang;
            satuanPend = satuanPendidikanDaftarUlang;
            uraian = `Pembayaran Daftar Ulang - ${nama}`;

            const tgg = await TunggakanModel.getTunggakanDaftarUlangByNameAndPendidikan(nama, satuanPend);
            if (tgg) {
                tgg.totalBayar += nominal;
                tgg.sisaBayar = tgg.totalTagihan - tgg.totalBayar;
                tgg.status = tgg.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
                await TunggakanModel.updateTunggakanDaftarUlang(tgg.id, tgg);
            }

        } else if (jenisTransaksi === 'Pemasukan') {
            prefix = 'KWI-IN';
            nama = uraianLain || ''; 
            satuanPend = ''; // Pemasukan tidak ada filter satuan pendidikan
            uraian = uraianLain || '';
        } else if (jenisTransaksi === 'Pengeluaran') {
            prefix = 'KWI-OUT';
            nama = uraianLain || '';
            satuanPend = satuanPendidikanPengeluaran || '';
            uraian = uraianLain || '';
        }

        const dateParts = dateStr.split('-');
        const month = dateParts[1];
        const year = dateParts[0];

        const transaksiTerbaru = await TransaksiModel.getAllTransaksi();
        const count = transaksiTerbaru.filter(t => t.noTransaksi.startsWith(prefix) && t.noTransaksi.includes(`/${month}/${year}`)).length + 1;
        const noTransaksi = `${prefix}/${String(count).padStart(3, '0')}/${month}/${year}`;

        await TransaksiModel.addTransaksi({
            tanggal: dateStr,
            noTransaksi,
            jenis: jenisTransaksi,
            namaSantri: nama,
            satuanPendidikan: satuanPend,
            nominal,
            rincianNames: rincianNames,
            rincianNominals: rincianNominals,
            metodePembayaran: metodePembayaran || 'Cash',
            dibayarkanKepada: dibayarkanKepada || '',
            kategoriDana: katDana || '',
            diterimaDari: diterimaDari || '',
            namaPemberi: namaPemberi || ''
        });

        await TransaksiModel.addLaporan({
            tanggal: dateStr,
            bulan: month,
            tahun: year,
            noTransaksi,
            uraian,
            pemasukan: (jenisTransaksi === 'Pengeluaran') ? 0 : nominal,
            pengeluaran: (jenisTransaksi === 'Pengeluaran') ? nominal : 0
        });

        res.json({ success: true, message: 'Transaksi berhasil disimpan!', noRef: noTransaksi });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.deleteTransaksi = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const trx = await TransaksiModel.getTransaksiById(id);

        if (trx) {
            if (trx.jenis === 'Pembayaran Pendaftaran Baru') {
                const tgg = await TunggakanModel.getTunggakanByNameAndPendidikan(trx.namaSantri, trx.satuanPendidikan);
                if (tgg) {
                    tgg.totalBayar -= trx.nominal;
                    tgg.sisaBayar = tgg.totalTagihan - tgg.totalBayar;
                    tgg.status = tgg.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
                    await TunggakanModel.updateTunggakan(tgg.id, tgg);
                }
            } else if (trx.jenis === 'Pembayaran Daftar Ulang') {
                const tgg = await TunggakanModel.getTunggakanDaftarUlangByNameAndPendidikan(trx.namaSantri, trx.satuanPendidikan);
                if (tgg) {
                    tgg.totalBayar -= trx.nominal;
                    tgg.sisaBayar = tgg.totalTagihan - tgg.totalBayar;
                    tgg.status = tgg.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
                    await TunggakanModel.updateTunggakanDaftarUlang(tgg.id, tgg);
                }
            }

            await TransaksiModel.deleteTransaksi(id);
            
            const laporanData = await TransaksiModel.getAllLaporan();
            const lap = laporanData.find(l => l.noTransaksi === trx.noTransaksi);
            if (lap) {
                await TransaksiModel.deleteLaporanByNoTransaksi(lap.noTransaksi);
            }
        }
        res.redirect('/input-transaksi');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.editTransaksi = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { tanggal, nominal, metodePembayaran } = req.body;
        
        const trx = await TransaksiModel.getTransaksiById(id);
        if (trx) {
            const nominalBaru = parseInt(nominal) || 0;
            const selisih = nominalBaru - trx.nominal;

            trx.nominal = nominalBaru;
            if (tanggal) trx.tanggal = tanggal;
            if (metodePembayaran) trx.metodePembayaran = metodePembayaran;

            if (trx.jenis === 'Pembayaran Pendaftaran Baru') {
                const tgg = await TunggakanModel.getTunggakanByNameAndPendidikan(trx.namaSantri, trx.satuanPendidikan);
                if (tgg) {
                    tgg.totalBayar += selisih;
                    tgg.sisaBayar = tgg.totalTagihan - tgg.totalBayar;
                    tgg.status = tgg.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
                    await TunggakanModel.updateTunggakan(tgg.id, tgg);
                }
            } else if (trx.jenis === 'Pembayaran Daftar Ulang') {
                const tgg = await TunggakanModel.getTunggakanDaftarUlangByNameAndPendidikan(trx.namaSantri, trx.satuanPendidikan);
                if (tgg) {
                    tgg.totalBayar += selisih;
                    tgg.sisaBayar = tgg.totalTagihan - tgg.totalBayar;
                    tgg.status = tgg.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
                    await TunggakanModel.updateTunggakanDaftarUlang(tgg.id, tgg);
                }
            }

            await TransaksiModel.updateTransaksi(id, trx);

            const laporanData = await TransaksiModel.getAllLaporan();
            const lap = laporanData.find(l => l.noTransaksi === trx.noTransaksi);
            if (lap) {
                if (tanggal) lap.tanggal = tanggal;
                if (trx.jenis === 'Pengeluaran') {
                    lap.pengeluaran = nominalBaru;
                } else {
                    lap.pemasukan = nominalBaru;
                }
                await TransaksiModel.updateLaporanByNoTransaksi(lap.noTransaksi, lap);
            }
        }
        res.json({ success: true, message: 'Transaksi berhasil diperbarui!' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
