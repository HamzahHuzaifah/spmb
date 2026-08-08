const SantriModel = require('../../models/SantriModel');

exports.getSantriBaru = async (req, res) => {
    try {
        // Ambil semua data santri baru dan daftar ulang dari database SPMB
        const santriBaru = await SantriModel.getAllSantri();
        const santriDaftarUlang = await SantriModel.getAllSantriDaftarUlang();
        
        // Fungsi helper untuk menormalkan nama lembaga dan menentukan kelas default
        const formatData = (nama, lembagaRaw) => {
            let lembagaAsli = (lembagaRaw || 'Lainnya').toLowerCase();
            let lembagaNormal = 'Lainnya';
            
            // Nama kelas persis dengan apa yang diinput walisantri di SPMB (misal: "PAUDQu A")
            let kelas = lembagaRaw || 'Pendaftaran Baru';
            
            // Normalisasi nama lembaga & set kelas default
            if (lembagaAsli.includes('madrasah')) {
                lembagaNormal = 'Madrasah';
            } else if (lembagaAsli.includes('paudqu')) {
                lembagaNormal = 'PAUDQu';
            } else if (lembagaAsli.includes('tpq')) {
                lembagaNormal = 'TPQ';
            } else if (lembagaAsli.includes('mdt')) {
                lembagaNormal = 'MDT';
            }

            return {
                nama: nama ? nama.toUpperCase() : nama,
                kelas: kelas,
                lembaga: lembagaNormal
            };
        };

        // Memetakan masing-masing data dari field yang benar
        const dataBaru = santriBaru.map(s => formatData(s.nama, s.pendidikan));
        const dataDaftarUlang = santriDaftarUlang.map(s => formatData(s.nama, s.lanjutKe));

        // Menggabungkan kedua array menjadi satu
        const semuaData = [...dataBaru, ...dataDaftarUlang];

        // Mengirimkan semua data kembali ke SIKMA
        res.status(200).json(semuaData);
    } catch (error) {
        console.error('API Error /api/santri-baru:', error);
        res.status(500).json({ error: 'Terjadi kesalahan pada server saat mengambil data santri.' });
    }
};

const TunggakanModel = require('../../models/TunggakanModel');
const TransaksiModel = require('../../models/TransaksiModel');

exports.getTunggakan = async (req, res) => {
    try {
        const tunggakanBaru = await TunggakanModel.getAllTunggakan();
        const tunggakanDaftarUlang = await TunggakanModel.getAllTunggakanDaftarUlang();

        const formatData = (item, isDaftarUlang) => {
            let lembagaAsli = (item.satuanPendidikan || 'Lainnya').toLowerCase();
            let lembagaNormal = 'Lainnya';
            if (lembagaAsli.includes('madrasah')) lembagaNormal = 'Madrasah';
            else if (lembagaAsli.includes('paudqu')) lembagaNormal = 'PAUDQu';
            else if (lembagaAsli.includes('tpq')) lembagaNormal = 'TPQ';
            else if (lembagaAsli.includes('mdt')) lembagaNormal = 'MDT';

            return {
                nama: item.nama ? item.nama.toUpperCase() : 'Tanpa Nama',
                kelas: isDaftarUlang ? 'Daftar Ulang' : 'Pendaftar Baru',
                lembaga: lembagaNormal,
                nama_tagihan: isDaftarUlang ? 'Tagihan Daftar Ulang SPMB' : 'Tagihan Pendaftaran SPMB',
                satuan_pendidikan_asli: item.satuanPendidikan,
                is_daftar_ulang: isDaftarUlang,
                total: item.totalTagihan || 0,
                page: 1, // dummy page
                dibayar: item.totalBayar || 0,
                sisa: item.sisaBayar || 0
            };
        };

        const dataBaru = tunggakanBaru.filter(t => t.sisaBayar > 0).map(t => formatData(t, false));
        const dataDaftarUlang = tunggakanDaftarUlang.filter(t => t.sisaBayar > 0).map(t => formatData(t, true));

        const semuaTunggakan = [...dataBaru, ...dataDaftarUlang];
        res.status(200).json(semuaTunggakan);
    } catch (error) {
        console.error('API Error /api/tunggakan:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data tunggakan.' });
    }
};

exports.postBayarTunggakan = async (req, res) => {
    try {
        const { no_transaksi, nama, satuan_pendidikan_asli, is_daftar_ulang, nominal, catatan } = req.body;

        if (!nama || !satuan_pendidikan_asli || !nominal) {
            return res.status(400).json({ error: 'Data tidak lengkap. Harap kirimkan nama, satuan_pendidikan_asli, dan nominal.' });
        }

        const bayar = parseInt(nominal);
        let tgg = null;

        const isDaftarUlang = is_daftar_ulang === true || is_daftar_ulang === 'true';

        if (isDaftarUlang) {
            tgg = await TunggakanModel.getTunggakanDaftarUlangByNameAndPendidikan(nama, satuan_pendidikan_asli);
            if (tgg) {
                tgg.totalBayar += bayar;
                tgg.sisaBayar = tgg.totalTagihan - tgg.totalBayar;
                tgg.status = tgg.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
                await TunggakanModel.updateTunggakanDaftarUlang(tgg.id, tgg);
            }
        } else {
            tgg = await TunggakanModel.getTunggakanByNameAndPendidikan(nama, satuan_pendidikan_asli);
            if (tgg) {
                tgg.totalBayar += bayar;
                tgg.sisaBayar = tgg.totalTagihan - tgg.totalBayar;
                tgg.status = tgg.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
                await TunggakanModel.updateTunggakan(tgg.id, tgg);
            }
        }

        if (!tgg) {
            return res.status(404).json({ error: 'Tunggakan tidak ditemukan.' });
        }

        // Catat transaksi dan laporan keuangan di SPMB
        const prefix = isDaftarUlang ? 'KWI-DU' : 'KWI-DB';
        const dateStr = new Date().toISOString().split('T')[0];
        const dateParts = dateStr.split('-');
        const year = dateParts[0];
        const month = dateParts[1];

        let finalNoTransaksi = no_transaksi;
        if (!finalNoTransaksi) {
            const transaksiTerbaru = await TransaksiModel.getAllTransaksi();
            const count = transaksiTerbaru.filter(t => t.noTransaksi && t.noTransaksi.startsWith(prefix) && t.noTransaksi.includes(`/${month}/${year}`)).length + 1;
            finalNoTransaksi = `${prefix}/${String(count).padStart(3, '0')}/${month}/${year}`;
        }

        // 1. Tambah Transaksi
        await TransaksiModel.addTransaksi({
            tanggal: dateStr,
            noTransaksi: finalNoTransaksi,
            jenis: isDaftarUlang ? 'Pembayaran Daftar Ulang' : 'Pembayaran Pendaftaran Baru',
            namaSantri: nama,
            satuanPendidikan: satuan_pendidikan_asli,
            nominal: bayar,
            metodePembayaran: 'Cash',
            dibayarkanKepada: 'SIKMA',
            kategoriDana: catatan || '',
            diterimaDari: nama,
            namaPemberi: nama,
            inputOleh: 'SIKMA'
        });

        // 2. Tambah Laporan
        const uraianCatatan = catatan ? ` (${catatan})` : '';
        await TransaksiModel.addLaporan({
            tanggal: dateStr,
            bulan: month,
            tahun: year,
            noTransaksi: finalNoTransaksi,
            uraian: `Pembayaran ${isDaftarUlang ? 'Daftar Ulang' : 'Pendaftaran Baru'} - ${nama} (via SIKMA)${uraianCatatan}`,
            pemasukan: bayar,
            pengeluaran: 0
        });

        res.status(200).json({ success: true, message: 'Pembayaran tunggakan berhasil diproses.', data: tgg });
    } catch (error) {
        console.error('API Error /api/bayar-tunggakan:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat memproses pembayaran.' });
    }
};

exports.postDeleteTunggakan = async (req, res) => {
    try {
        const { no_transaksi } = req.body;
        if (!no_transaksi) return res.status(400).json({ error: 'no_transaksi wajib dikirim' });

        // Cari transaksi di SPMB berdasarkan no_transaksi
        const allTransaksi = await TransaksiModel.getAllTransaksi();
        const transaksi = allTransaksi.find(t => t.noTransaksi === no_transaksi);
        
        if (transaksi) {
            // Reverse tunggakan
            const isDaftarUlang = transaksi.jenis === 'Pembayaran Daftar Ulang';
            let tgg;
            if (isDaftarUlang) {
                tgg = await TunggakanModel.getTunggakanDaftarUlangByNameAndPendidikan(transaksi.namaSantri, transaksi.satuanPendidikan);
                if (tgg) {
                    tgg.totalBayar -= transaksi.nominal;
                    tgg.sisaBayar = tgg.totalTagihan - tgg.totalBayar;
                    tgg.status = tgg.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
                    await TunggakanModel.updateTunggakanDaftarUlang(tgg.id, tgg);
                }
            } else {
                tgg = await TunggakanModel.getTunggakanByNameAndPendidikan(transaksi.namaSantri, transaksi.satuanPendidikan);
                if (tgg) {
                    tgg.totalBayar -= transaksi.nominal;
                    tgg.sisaBayar = tgg.totalTagihan - tgg.totalBayar;
                    tgg.status = tgg.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
                    await TunggakanModel.updateTunggakan(tgg.id, tgg);
                }
            }
            // Hapus Transaksi & Laporan
            await TransaksiModel.deleteTransaksi(transaksi.id);
            const allLaporan = await TransaksiModel.getAllLaporan();
            const laporan = allLaporan.find(l => l.noTransaksi === no_transaksi);
            if (laporan) {
                await TransaksiModel.deleteLaporan(laporan.id);
            }
        }
        res.status(200).json({ success: true, message: 'Transaksi berhasil dihapus dari SPMB' });
    } catch (error) {
        console.error('API Error /api/delete-tunggakan:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat menghapus sinkronisasi' });
    }
};

exports.postEditTunggakan = async (req, res) => {
    try {
        const { no_transaksi, nominal_lama, nominal_baru, tanggal_baru } = req.body;
        if (!no_transaksi) return res.status(400).json({ error: 'no_transaksi wajib dikirim' });

        const allTransaksi = await TransaksiModel.getAllTransaksi();
        const transaksi = allTransaksi.find(t => t.noTransaksi === no_transaksi);

        if (transaksi) {
            const selisih = nominal_baru - nominal_lama;

            // Sesuaikan tunggakan
            const isDaftarUlang = transaksi.jenis === 'Pembayaran Daftar Ulang';
            let tgg;
            if (isDaftarUlang) {
                tgg = await TunggakanModel.getTunggakanDaftarUlangByNameAndPendidikan(transaksi.namaSantri, transaksi.satuanPendidikan);
                if (tgg) {
                    tgg.totalBayar += selisih;
                    tgg.sisaBayar = tgg.totalTagihan - tgg.totalBayar;
                    tgg.status = tgg.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
                    await TunggakanModel.updateTunggakanDaftarUlang(tgg.id, tgg);
                }
            } else {
                tgg = await TunggakanModel.getTunggakanByNameAndPendidikan(transaksi.namaSantri, transaksi.satuanPendidikan);
                if (tgg) {
                    tgg.totalBayar += selisih;
                    tgg.sisaBayar = tgg.totalTagihan - tgg.totalBayar;
                    tgg.status = tgg.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
                    await TunggakanModel.updateTunggakan(tgg.id, tgg);
                }
            }

            // Update Transaksi
            const tUpdateData = { ...transaksi, nominal: nominal_baru };
            if (tanggal_baru) tUpdateData.tanggal = tanggal_baru;
            await TransaksiModel.updateTransaksi(transaksi.id, tUpdateData);

            // Update Laporan
            const allLaporan = await TransaksiModel.getAllLaporan();
            const laporan = allLaporan.find(l => l.noTransaksi === no_transaksi);
            if (laporan) {
                const lUpdateData = { ...laporan, pemasukan: nominal_baru };
                if (tanggal_baru) {
                    lUpdateData.tanggal = tanggal_baru;
                    const dateParts = tanggal_baru.split('-');
                    lUpdateData.tahun = dateParts[0];
                    lUpdateData.bulan = dateParts[1];
                }
                await TransaksiModel.updateLaporan(laporan.id, lUpdateData);
            }
        }
        res.status(200).json({ success: true, message: 'Transaksi berhasil diupdate di SPMB' });
    } catch (error) {
        console.error('API Error /api/edit-tunggakan:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat edit sinkronisasi' });
    }
};

const SystemSettingModel = require('../../models/SystemSetting');

exports.getStatusBuku = async (req, res) => {
    try {
        let isTutupBukuStr = await SystemSettingModel.getSetting('TUTUP_BUKU');
        let isTutupBuku = isTutupBukuStr === 'true';
        res.status(200).json({ success: true, isTutupBuku: isTutupBuku });
    } catch (error) {
        console.error('API Error /api/status-buku:', error);
        res.status(500).json({ success: false, error: 'Terjadi kesalahan' });
    }
};

exports.getSaldoPanitiaSpmb = async (req, res) => {
    try {
        const allLaporan = await TransaksiModel.getAllLaporan();
        
        // Filter Laporan Internal SPMB (bukan via SIKMA)
        const laporanInternal = allLaporan.filter(l => l.uraian && !l.uraian.includes('(via SIKMA)'));
        
        let totalPemasukan = 0;
        let totalPengeluaran = 0;
        
        laporanInternal.forEach(l => {
            totalPemasukan += (parseFloat(l.pemasukan) || 0);
            totalPengeluaran += (parseFloat(l.pengeluaran) || 0);
        });
        
        const saldoFisikPanitia = totalPemasukan - totalPengeluaran;
        
        res.status(200).json({ success: true, saldo_fisik_panitia: saldoFisikPanitia });
    } catch (error) {
        console.error('API Error /api/saldo-panitia-spmb:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat menghitung saldo panitia SPMB.' });
    }
};
