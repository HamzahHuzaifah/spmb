const TransaksiModel = require('../../models/TransaksiModel');

exports.getLaporan = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // 10 data per halaman untuk laporan
        const offset = (page - 1) * limit;

        const search = req.query.search || '';
        const filterBulan = req.query.bulan || '';
        const filterTahun = req.query.tahun || '';

        const laporanData = await TransaksiModel.getLaporanPaginated(limit, offset, search, filterBulan, filterTahun);
        const fullLaporanData = await TransaksiModel.getLaporanPaginated(10000, 0, search, filterBulan, filterTahun);
        const totalData = await TransaksiModel.getTotalLaporan(search, filterBulan, filterTahun);
        const totalPages = Math.ceil(totalData / limit);

        let saldoAwal = 0;
        if (filterBulan && filterTahun) {
            saldoAwal = await TransaksiModel.getSaldoAwalLaporan(filterBulan, filterTahun);
        }

        // Tambahkan selisih pemasukan-pengeluaran dari data yang di-skip karena pagination
        if (offset > 0) {
            const skippedData = await TransaksiModel.getLaporanPaginated(offset, 0, search, filterBulan, filterTahun);
            skippedData.forEach(item => {
                saldoAwal += ((item.pemasukan || 0) - (item.pengeluaran || 0));
            });
        }

        res.render('laporan', { 
            title: 'Laporan Keuangan', 
            activePage: 'laporan', 
            laporan: laporanData,
            fullLaporanData: fullLaporanData,
            currentPage: page,
            totalPages: totalPages,
            totalData: totalData,
            searchQuery: search,
            bulanQuery: filterBulan,
            tahunQuery: filterTahun,
            saldoAwalQuery: saldoAwal
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getLaporanBulanan = async (req, res) => {
    try {
        const search = req.query.search || '';
        const filterBulan = req.query.bulan || '';
        const filterTahun = req.query.tahun || '';

        // Gunakan fungsi yang sama tapi limit besar untuk ambil semua data
        const fullLaporanData = await TransaksiModel.getLaporanPaginated(10000, 0, search, filterBulan, filterTahun);
        
        let saldoAwal = 0;
        if (filterBulan && filterTahun) {
            saldoAwal = await TransaksiModel.getSaldoAwalLaporan(filterBulan, filterTahun);
        }

        res.render('laporan-bulanan', { 
            title: 'Cetak Laporan Keuangan', 
            laporan: fullLaporanData,
            searchQuery: search,
            bulanQuery: filterBulan,
            tahunQuery: filterTahun,
            saldoAwalQuery: saldoAwal
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
