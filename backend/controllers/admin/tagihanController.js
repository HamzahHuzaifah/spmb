const TagihanModel = require('../../models/TagihanModel');
const TunggakanModel = require('../../models/TunggakanModel');
const xlsx = require('xlsx');

exports.getTagihan = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 1000000;
        const offset = 0;

        const search = req.query.search || '';
        const pendidikan = req.query.pendidikan || '';

        const tagihanData = await TagihanModel.getTagihanPaginated(limit, offset, search, pendidikan);
        const totalData = await TagihanModel.getTotalTagihan(search, pendidikan);
        const totalPages = Math.ceil(totalData / limit);

        const tunggakanData = await TunggakanModel.getAllTunggakan();

        res.render('tagihan', { 
            title: 'Data Tagihan Pendaftaran Baru', 
            activePage: 'tagihan', 
            tagihan: tagihanData, 
            tunggakan: tunggakanData,
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

exports.getTagihanDaftarUlang = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 1000000;
        const offset = 0;

        const search = req.query.search || '';
        const pendidikan = req.query.pendidikan || '';

        const tagihanDaftarUlangData = await TagihanModel.getTagihanDaftarUlangPaginated(limit, offset, search, pendidikan);
        const totalData = await TagihanModel.getTotalTagihanDaftarUlang(search, pendidikan);
        const totalPages = Math.ceil(totalData / limit);

        const tunggakanDaftarUlangData = await TunggakanModel.getAllTunggakanDaftarUlang();
        
        res.render('tagihan-daftar-ulang', { 
            title: 'Data Tagihan Daftar Ulang', 
            activePage: 'tagihan-daftar-ulang', 
            tagihan: tagihanDaftarUlangData, 
            tunggakanDaftarUlang: tunggakanDaftarUlangData,
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

exports.editTagihan = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updatedData = req.body;
        const tagihan = await TagihanModel.getTagihanById(id);
        if (!tagihan) return res.status(404).send('Not Found');

        const formulir = updatedData.formulir !== undefined ? parseInt(updatedData.formulir) : tagihan.formulir;
        const uangPangkal = updatedData.uangPangkal !== undefined ? parseInt(updatedData.uangPangkal) : tagihan.uangPangkal;
        const perlengkapan = updatedData.perlengkapan !== undefined ? parseInt(updatedData.perlengkapan) : tagihan.perlengkapan;
        const seragam = updatedData.seragam !== undefined ? parseInt(updatedData.seragam) : tagihan.seragam;
        const spp = updatedData.spp !== undefined ? parseInt(updatedData.spp) : tagihan.spp;
        
        const totalTagihan = (formulir || 0) + (uangPangkal || 0) + (perlengkapan || 0) + (seragam || 0) + (spp || 0);

        await TagihanModel.updateTagihan(id, {
            formulir, uangPangkal, perlengkapan, seragam, spp, totalTagihan
        });

        // Tunggakan updates
        if (tagihan) {
            const tunggakanData = await TunggakanModel.getAllTunggakan();
            const idx = tunggakanData.findIndex(t => t.nama === tagihan.nama && t.satuanPendidikan === tagihan.satuanPendidikan);
            if (idx !== -1) {
                const t = tunggakanData[idx];
                t.totalTagihan = totalTagihan;
                t.sisaBayar = t.totalTagihan - t.totalBayar;
                t.status = t.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
                await TunggakanModel.updateTunggakan(t.id, t);
            }
        }
        res.json({ success: true, message: 'Tagihan berhasil diperbarui!' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.editTagihanDaftarUlang = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updatedData = req.body;
        const tagihan = await TagihanModel.getTagihanDaftarUlangById(id);
        if (!tagihan) return res.status(404).send('Not Found');

        const formulir = updatedData.formulir !== undefined ? parseInt(updatedData.formulir) : tagihan.formulir;
        const uangPangkal = updatedData.uangPangkal !== undefined ? parseInt(updatedData.uangPangkal) : tagihan.uangPangkal;
        const perlengkapan = updatedData.perlengkapan !== undefined ? parseInt(updatedData.perlengkapan) : tagihan.perlengkapan;
        const seragam = updatedData.seragam !== undefined ? parseInt(updatedData.seragam) : tagihan.seragam;
        const spp = updatedData.spp !== undefined ? parseInt(updatedData.spp) : tagihan.spp;
        
        const totalTagihan = (formulir || 0) + (uangPangkal || 0) + (perlengkapan || 0) + (seragam || 0) + (spp || 0);

        await TagihanModel.updateTagihanDaftarUlang(id, {
            formulir, uangPangkal, perlengkapan, seragam, spp, totalTagihan
        });
        if (tagihan) {
            const tunggakanData = await TunggakanModel.getAllTunggakanDaftarUlang();
            const idx = tunggakanData.findIndex(t => t.nama === tagihan.nama && t.satuanPendidikan === tagihan.satuanPendidikan);
            if (idx !== -1) {
                const t = tunggakanData[idx];
                t.totalTagihan = totalTagihan;
                t.sisaBayar = t.totalTagihan - t.totalBayar;
                t.status = t.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
                await TunggakanModel.updateTunggakanDaftarUlang(t.id, t);
            }
        }
        res.json({ success: true, message: 'Tagihan berhasil diperbarui!' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.exportTagihanExcel = async (req, res) => {
    try {
        const search = req.query.search || '';
        const pendidikan = req.query.pendidikan || '';

        const data = await TagihanModel.getAllTagihanFiltered(search, pendidikan);
        
        const worksheetData = data.map((item, index) => ({
            'No': index + 1,
            'Nama Santri': item.nama,
            'Jalur': item.jalur,
            'Pendidikan': item.satuanPendidikan,
            'Formulir': item.formulir,
            'Uang Pangkal': item.uangPangkal,
            'Perlengkapan': item.perlengkapan,
            'Seragam': item.seragam,
            'SPP': item.spp,
            'Total Tagihan': item.totalTagihan
        }));

        const worksheet = xlsx.utils.json_to_sheet(worksheetData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Tagihan Baru');

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="Data_Tagihan_Baru.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.exportTagihanDaftarUlangExcel = async (req, res) => {
    try {
        const search = req.query.search || '';
        const pendidikan = req.query.pendidikan || '';

        const data = await TagihanModel.getAllTagihanDaftarUlangFiltered(search, pendidikan);
        
        const worksheetData = data.map((item, index) => ({
            'No': index + 1,
            'Nama Santri': item.nama,
            'Jalur': item.jalur,
            'Pendidikan Sebelumnya': item.satuanPendidikanSebelumnya,
            'Pendidikan Lanjutan': item.satuanPendidikan,
            'Formulir': item.formulir,
            'Uang Pangkal': item.uangPangkal,
            'Perlengkapan': item.perlengkapan,
            'Seragam': item.seragam,
            'SPP': item.spp,
            'Total Tagihan': item.totalTagihan
        }));

        const worksheet = xlsx.utils.json_to_sheet(worksheetData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Tagihan Daftar Ulang');

        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="Data_Tagihan_Daftar_Ulang.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
