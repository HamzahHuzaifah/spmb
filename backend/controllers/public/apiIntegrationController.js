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
        const { nama, satuan_pendidikan_asli, is_daftar_ulang, nominal } = req.body;

        if (!nama || !satuan_pendidikan_asli || !nominal) {
            return res.status(400).json({ error: 'Data tidak lengkap. Harap kirimkan nama, satuan_pendidikan_asli, dan nominal.' });
        }

        const bayar = parseInt(nominal);
        let tgg = null;

        if (is_daftar_ulang) {
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

        res.status(200).json({ success: true, message: 'Pembayaran tunggakan berhasil diproses.', data: tgg });
    } catch (error) {
        console.error('API Error /api/bayar-tunggakan:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat memproses pembayaran.' });
    }
};
