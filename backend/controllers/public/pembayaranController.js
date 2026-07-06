const SantriModel = require('../../models/SantriModel');
const TunggakanModel = require('../../models/TunggakanModel');

exports.getFormPembayaran = (req, res) => {
    res.render('public/layout', {
        title: 'Cek Info Pembayaran',
        bodyView: 'info-pembayaran',
        result: null,
        error: null,
        nomorPendaftaran: ''
    });
};

exports.cekPembayaran = async (req, res) => {
    try {
        const { nomorPendaftaran } = req.body;
        if (!nomorPendaftaran) {
            return res.render('public/layout', {
                title: 'Cek Info Pembayaran',
                bodyView: 'info-pembayaran',
                result: null,
                error: 'Nomor Pendaftaran harus diisi.',
                nomorPendaftaran: ''
            });
        }

        // 1. Cari di tabel Santri Baru
        let santri = await SantriModel.getSantriByNomorPendaftaran(nomorPendaftaran);
        let jenis = 'baru';
        
        // 2. Jika tidak ada, cari di tabel Santri Daftar Ulang
        if (!santri) {
            santri = await SantriModel.getSantriDaftarUlangByNomorPendaftaran(nomorPendaftaran);
            jenis = 'daftar_ulang';
        }

        // 3. Jika tetap tidak ada
        if (!santri) {
            const deletedReg = await SantriModel.getDeletedRegistration(nomorPendaftaran);
            if (deletedReg) {
                return res.render('public/layout', {
                    title: 'Cek Info Pembayaran',
                    bodyView: 'info-pembayaran',
                    result: null,
                    error: `Nomor Pendaftaran ${nomorPendaftaran} telah dihapus/digabungkan karena terdeteksi duplikat atas nama "${deletedReg.nama}". Silakan gunakan Nomor Pendaftaran aktif Anda: "${deletedReg.nomorPendaftaranAktif}".`,
                    nomorPendaftaran
                });
            }

            return res.render('public/layout', {
                title: 'Cek Info Pembayaran',
                bodyView: 'info-pembayaran',
                result: null,
                error: 'Nomor Pendaftaran tidak ditemukan. Pastikan Anda telah memasukkan nomor yang benar.',
                nomorPendaftaran
            });
        }

        // 4. Ambil tagihan/tunggakan berdasarkan nama
        let tagihan = null;
        if (jenis === 'baru') {
            tagihan = await TunggakanModel.getTunggakanByName(santri.nama);
        } else {
            tagihan = await TunggakanModel.getTunggakanDaftarUlangByName(santri.nama);
        }

        // 5. Render hasil
        res.render('public/layout', {
            title: 'Cek Info Pembayaran',
            bodyView: 'info-pembayaran',
            result: {
                santri,
                jenis,
                tagihan
            },
            error: null,
            nomorPendaftaran
        });
        
    } catch (error) {
        console.error("Error cekPembayaran:", error);
        res.render('public/layout', {
            title: 'Cek Info Pembayaran',
            bodyView: 'info-pembayaran',
            result: null,
            error: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
            nomorPendaftaran: req.body.nomorPendaftaran || ''
        });
    }
};
