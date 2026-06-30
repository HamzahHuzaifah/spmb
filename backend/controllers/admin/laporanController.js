const TransaksiModel = require('../../models/TransaksiModel');
const xlsx = require('xlsx');

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
            saldoAwal = Number(await TransaksiModel.getSaldoAwalLaporan(filterBulan, filterTahun)) || 0;
        }

        // Tambahkan selisih pemasukan-pengeluaran dari data yang di-skip karena pagination
        if (offset > 0) {
            const skippedData = await TransaksiModel.getLaporanPaginated(offset, 0, search, filterBulan, filterTahun);
            skippedData.forEach(item => {
                saldoAwal += ((Number(item.pemasukan) || 0) - (Number(item.pengeluaran) || 0));
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
            saldoAwal = Number(await TransaksiModel.getSaldoAwalLaporan(filterBulan, filterTahun)) || 0;
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

exports.exportLaporanExcel = async (req, res) => {
    try {
        const search = req.query.search || '';
        const filterBulan = req.query.bulan || '';
        const filterTahun = req.query.tahun || '';

        // Gunakan fungsi yang sama tapi limit besar untuk ambil semua data
        const fullLaporanData = await TransaksiModel.getLaporanPaginated(10000, 0, search, filterBulan, filterTahun);
        
        let saldoAwal = 0;
        if (filterBulan && filterTahun) {
            saldoAwal = Number(await TransaksiModel.getSaldoAwalLaporan(filterBulan, filterTahun)) || 0;
        }

        const dataToExport = [];
        let saldo = Number(saldoAwal);

        // If specific month/year is requested, add an initial row for the starting balance
        if (filterBulan && filterTahun) {
            const monthsList = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            let selBulanIdx = parseInt(filterBulan) - 1;
            let selTahun = parseInt(filterTahun);
            let prevMonthName = selBulanIdx === 0 ? "Desember" : monthsList[selBulanIdx - 1];
            let prevMonthYear = selBulanIdx === 0 ? selTahun - 1 : selTahun;

            dataToExport.push({
                'No': '-',
                'Tanggal': `01/${filterBulan}/${selTahun}`,
                'Uraian': `Saldo Bulan ${prevMonthName} ${prevMonthYear}`,
                'No. Transaksi': '-',
                'Pemasukan': saldo > 0 ? saldo : 0,
                'Pengeluaran': saldo < 0 ? Math.abs(saldo) : 0,
                'Saldo Akhir': saldo
            });
        }

        let no = 1;
        fullLaporanData.forEach(item => {
            saldo = Number(saldo) + (Number(item.pemasukan) || 0) - (Number(item.pengeluaran) || 0);
            dataToExport.push({
                'No': no++,
                'Tanggal': item.tanggal,
                'Uraian': item.uraian,
                'No. Transaksi': item.noTransaksi,
                'Pemasukan': Number(item.pemasukan) || 0,
                'Pengeluaran': Number(item.pengeluaran) || 0,
                'Saldo Akhir': saldo
            });
        });

        const ws = xlsx.utils.json_to_sheet(dataToExport);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Data Laporan');

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', `attachment; filename="Data_Laporan_${filterBulan}_${filterTahun}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error("Error Export Laporan Excel:", err);
        res.status(500).send('Server Error');
    }
};
