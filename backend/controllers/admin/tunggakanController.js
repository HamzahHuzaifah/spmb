const TunggakanModel = require('../../models/TunggakanModel');
const xlsx = require('xlsx');

exports.getTunggakan = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 1000000;
        const offset = 0;

        const search = req.query.search || '';
        const statusFilter = req.query.status || '';

        const tunggakanData = await TunggakanModel.getTunggakanPaginated(limit, offset, search, statusFilter);
        const totalData = await TunggakanModel.getTotalTunggakan(search, statusFilter);
        const totalPages = Math.ceil(totalData / limit);

        res.render('tunggakan', { 
            title: 'Data Tunggakan Santri Baru', 
            activePage: 'tunggakan', 
            tunggakan: tunggakanData,
            currentPage: page,
            totalPages: totalPages,
            totalData: totalData,
            searchQuery: search,
            statusQuery: statusFilter
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getTunggakanDaftarUlang = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 1000000;
        const offset = 0;

        const search = req.query.search || '';
        const statusFilter = req.query.status || '';

        const tunggakanDaftarUlangData = await TunggakanModel.getTunggakanDaftarUlangPaginated(limit, offset, search, statusFilter);
        const totalData = await TunggakanModel.getTotalTunggakanDaftarUlang(search, statusFilter);
        const totalPages = Math.ceil(totalData / limit);

        res.render('tunggakan-daftar-ulang', { 
            title: 'Data Tunggakan Daftar Ulang', 
            activePage: 'tunggakan-daftar-ulang', 
            tunggakan: tunggakanDaftarUlangData,
            currentPage: page,
            totalPages: totalPages,
            totalData: totalData,
            searchQuery: search,
            statusQuery: statusFilter
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.exportTunggakanExcel = async (req, res) => {
    try {
        const search = req.query.search || '';
        const statusFilter = req.query.status || '';

        const data = await TunggakanModel.getAllTunggakanFiltered(search, statusFilter);
        
        const worksheetData = data.map((item, index) => ({
            'No': index + 1,
            'Nama Santri': item.nama ? item.nama.toUpperCase() : '',
            'Pendidikan': item.satuanPendidikan,
            'No Telepon': item.noTelepon,
            'Total Tagihan': item.totalTagihan,
            'Total Bayar': item.totalBayar,
            'Sisa Bayar': item.sisaBayar,
            'Status': item.status
        }));

        const worksheet = xlsx.utils.json_to_sheet(worksheetData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Tunggakan Baru');

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="Data_Tunggakan_Baru.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.exportTunggakanDaftarUlangExcel = async (req, res) => {
    try {
        const search = req.query.search || '';
        const statusFilter = req.query.status || '';

        const data = await TunggakanModel.getAllTunggakanDaftarUlangFiltered(search, statusFilter);
        
        const worksheetData = data.map((item, index) => ({
            'No': index + 1,
            'Nama Santri': item.nama ? item.nama.toUpperCase() : '',
            'Pendidikan': item.satuanPendidikan,
            'No Telepon': item.noTelepon,
            'Total Tagihan': item.totalTagihan,
            'Total Bayar': item.totalBayar,
            'Sisa Bayar': item.sisaBayar,
            'Status': item.status
        }));

        const worksheet = xlsx.utils.json_to_sheet(worksheetData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Tunggakan Daftar Ulang');

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="Data_Tunggakan_Daftar_Ulang.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
