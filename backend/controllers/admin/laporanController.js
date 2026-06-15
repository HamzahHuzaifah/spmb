const TransaksiModel = require('../../models/TransaksiModel');

exports.getLaporan = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20; // 20 data per halaman untuk laporan
        const offset = (page - 1) * limit;

        const search = req.query.search || '';
        const filterBulan = req.query.bulan || '';
        const filterTahun = req.query.tahun || '';

        const laporanData = await TransaksiModel.getLaporanPaginated(limit, offset, search, filterBulan, filterTahun);
        const totalData = await TransaksiModel.getTotalLaporan(search, filterBulan, filterTahun);
        const totalPages = Math.ceil(totalData / limit);

        // Hapus pemanggilan getAllTransaksi() agar memori tidak penuh

        res.render('laporan', { 
            title: 'Laporan Keuangan', 
            activePage: 'laporan', 
            laporan: laporanData,
            currentPage: page,
            totalPages: totalPages,
            totalData: totalData,
            searchQuery: search,
            bulanQuery: filterBulan,
            tahunQuery: filterTahun
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
