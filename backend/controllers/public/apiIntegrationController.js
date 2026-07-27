const SantriModel = require('../../models/SantriModel');

exports.getSantriBaru = async (req, res) => {
    try {
        // Ambil semua data santri baru dan daftar ulang dari database SPMB
        const santriBaru = await SantriModel.getAllSantri();
        const santriDaftarUlang = await SantriModel.getAllSantriDaftarUlang();
        
        // Fungsi helper untuk menormalkan nama lembaga dan menentukan kelas default
        const formatData = (nama, lembagaRaw) => {
            let kelas = 'Pendaftaran Baru';
            let lembagaAsli = (lembagaRaw || 'Lainnya').toLowerCase();
            let lembagaNormal = 'Lainnya';
            
            // Normalisasi nama lembaga & set kelas default
            if (lembagaAsli.includes('madrasah')) {
                lembagaNormal = 'Madrasah';
                kelas = 'Kelas 1';
            } else if (lembagaAsli.includes('paudqu')) {
                lembagaNormal = 'PAUDQu';
                kelas = 'Arafah (A)';
            } else if (lembagaAsli.includes('tpq')) {
                lembagaNormal = 'TPQ';
                kelas = 'Jilid 1';
            } else if (lembagaAsli.includes('mdt')) {
                lembagaNormal = 'MDT';
                kelas = 'Kelas Awwal';
            }

            return {
                nama: nama,
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
