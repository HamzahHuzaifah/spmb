const TunggakanModel = require('../../models/TunggakanModel');

exports.getTunggakan = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

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
        const limit = 10;
        const offset = (page - 1) * limit;

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
