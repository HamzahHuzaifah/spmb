const TransaksiModel = require('../../models/TransaksiModel');
const SantriModel = require('../../models/SantriModel');

// ---- Helper Terbilang Bahasa Indonesia ----
function angkaKeTerbilang(nilai) {
    nilai = Math.abs(nilai);
    const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    let temp = "";

    if (nilai < 12) {
        temp = " " + huruf[nilai];
    } else if (nilai < 20) {
        temp = angkaKeTerbilang(nilai - 10) + " Belas";
    } else if (nilai < 100) {
        temp = angkaKeTerbilang(Math.floor(nilai / 10)) + " Puluh" + angkaKeTerbilang(nilai % 10);
    } else if (nilai < 200) {
        temp = " Seratus" + angkaKeTerbilang(nilai - 100);
    } else if (nilai < 1000) {
        temp = angkaKeTerbilang(Math.floor(nilai / 100)) + " Ratus" + angkaKeTerbilang(nilai % 100);
    } else if (nilai < 2000) {
        temp = " Seribu" + angkaKeTerbilang(nilai - 1000);
    } else if (nilai < 1000000) {
        temp = angkaKeTerbilang(Math.floor(nilai / 1000)) + " Ribu" + angkaKeTerbilang(nilai % 1000);
    } else if (nilai < 1000000000) {
        temp = angkaKeTerbilang(Math.floor(nilai / 1000000)) + " Juta" + angkaKeTerbilang(nilai % 1000000);
    } else if (nilai < 1000000000000) {
        temp = angkaKeTerbilang(Math.floor(nilai / 1000000000)) + " Milyar" + angkaKeTerbilang(nilai % 1000000000);
    } else if (nilai < 1000000000000000) {
        temp = angkaKeTerbilang(Math.floor(nilai / 1000000000000)) + " Triliun" + angkaKeTerbilang(nilai % 1000000000000);
    }
    return temp.trim();
}

function terbilangIndo(nominal) {
    if (nominal === 0) return "Nol Rupiah";
    return angkaKeTerbilang(nominal) + " Rupiah";
}

exports.getKwitansi = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const trx = await TransaksiModel.getTransaksiById(id);

        if (!trx) {
            return res.status(404).send('Transaksi tidak ditemukan');
        }

        const isPembayaran = trx.noTransaksi.startsWith('KWI-DB/') || trx.noTransaksi.startsWith('KWI-DU/');
        const isPengeluaran = trx.jenis === 'Pengeluaran';

        let namaWali = '-';
        let namaSantri = '-';
        let satuanPendidikan = '-';
        let jalurPendaftaran = '-';
        let uraianPembayaran = trx.namaSantri;

        const laporanData = await TransaksiModel.getAllLaporan();

        if (isPembayaran) {
            const santriData = await SantriModel.getAllSantri();
            const santriDaftarUlangData = await SantriModel.getAllSantriDaftarUlang();

            let santri = santriData.find(s => s.nama === trx.namaSantri);
            if (santri) {
                namaWali = santri.namaAyah || santri.namaIbu || '-';
                namaSantri = santri.nama;
                satuanPendidikan = santri.pendidikan || '-';
                jalurPendaftaran = santri.jalurPendaftaran || '-';
            } else {
                santri = santriDaftarUlangData.find(s => s.nama === trx.namaSantri);
                if (santri) {
                    namaWali = santri.namaAyah || santri.namaIbu || '-';
                    namaSantri = santri.nama;
                    satuanPendidikan = santri.lanjutKe || '-';
                    jalurPendaftaran = santri.jalurPendaftaran || '-';
                }
            }
            
            const lap = laporanData.find(l => l.noTransaksi === trx.noTransaksi);
            if (lap) uraianPembayaran = lap.uraian;
        } else {
            const lap = laporanData.find(l => l.noTransaksi === trx.noTransaksi);
            if (lap) uraianPembayaran = lap.uraian;
            satuanPendidikan = trx.satuanPendidikan || 'MADRASAH';
        }

        const terbilangStr = terbilangIndo(trx.nominal);
        const nominalFormat = trx.nominal.toLocaleString('id-ID');
        const namaPetugas = 'Henny Maulida Putri, S.Pd.';

        // Parse rincian from JSON strings if needed
        let rincianNames = [];
        let rincianNominals = [];
        try { 
            let pNames = trx.rincianNames ? JSON.parse(trx.rincianNames) : [];
            if (typeof pNames === 'string') pNames = JSON.parse(pNames);
            rincianNames = pNames;
        } catch (e) { rincianNames = []; }
        
        try { 
            let pNoms = trx.rincianNominals ? JSON.parse(trx.rincianNominals) : [];
            if (typeof pNoms === 'string') pNoms = JSON.parse(pNoms);
            rincianNominals = pNoms;
        } catch (e) { rincianNominals = []; }

        // Format Tanggal (YYYY-MM-DD -> DD Bulan YYYY)
        let tanggalCetak = trx.tanggal;
        if (trx.tanggal) {
            const parts = trx.tanggal.split('-');
            if (parts.length === 3) {
                const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                const day = parseInt(parts[2], 10);
                const month = monthNames[parseInt(parts[1], 10) - 1];
                const year = parts[0];
                tanggalCetak = `${day} ${month} ${year}`;
            }
        }

        res.render('kwitansi', {
            no_transaksi: trx.noTransaksi,
            nama_wali: namaWali,
            nama_santri: namaSantri,
            satuan_pendidikan: satuanPendidikan,
            jalur_pendaftaran: jalurPendaftaran,
            uraian_pembayaran: uraianPembayaran,
            terbilang: terbilangStr,
            nominal_format: nominalFormat,
            tanggal_cetak: tanggalCetak, 
            nama_petugas: namaPetugas,
            is_pembayaran: isPembayaran,
            is_pengeluaran: isPengeluaran,
            dibayarkanKepada: trx.dibayarkanKepada || '',
            kategoriDana: trx.kategoriDana || '',
            rincianNames: rincianNames,
            rincianNominals: rincianNominals,
            diterimaDari: trx.diterimaDari || '',
            namaPemberi: trx.namaPemberi || '',
            docTitle: trx.docTitle || '',
            diterimaDariPembayaran: trx.diterimaDariPembayaran || '',
            dibayarkanKepadaSign: trx.dibayarkanKepadaSign || '',
            layoutMarginTop: trx.layoutMarginTop || '6.5cm',
            layoutMarginLeft: trx.layoutMarginLeft || '2.5cm',
            ttdVisible: trx.ttdVisible !== 0,
            ttdWidth: trx.ttdWidth || '120px',
            ttdX: trx.ttdX || 0,
            ttdY: trx.ttdY || 0,
            rowOrder: trx.rowOrder || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.editKwitansiDetail = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const trx = await TransaksiModel.getTransaksiById(id);

        if (!trx) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
        }

        if (req.body.dibayarkanKepada !== undefined) trx.dibayarkanKepada = req.body.dibayarkanKepada;
        if (req.body.kategoriDana !== undefined) trx.kategoriDana = req.body.kategoriDana;
        if (req.body.diterimaDari !== undefined) trx.diterimaDari = req.body.diterimaDari;
        if (req.body.namaPemberi !== undefined) trx.namaPemberi = req.body.namaPemberi;
        
        if (req.body.docTitle !== undefined) trx.docTitle = req.body.docTitle;
        if (req.body.diterimaDariPembayaran !== undefined) trx.diterimaDariPembayaran = req.body.diterimaDariPembayaran;
        if (req.body.dibayarkanKepadaSign !== undefined) trx.dibayarkanKepadaSign = req.body.dibayarkanKepadaSign;
        if (req.body.layoutMarginTop !== undefined) trx.layoutMarginTop = req.body.layoutMarginTop;
        if (req.body.layoutMarginLeft !== undefined) trx.layoutMarginLeft = req.body.layoutMarginLeft;
        if (req.body.ttdVisible !== undefined) trx.ttdVisible = req.body.ttdVisible ? 1 : 0;
        if (req.body.ttdWidth !== undefined) trx.ttdWidth = req.body.ttdWidth;
        if (req.body.ttdX !== undefined) trx.ttdX = req.body.ttdX;
        if (req.body.ttdY !== undefined) trx.ttdY = req.body.ttdY;
        if (req.body.rowOrder !== undefined) trx.rowOrder = req.body.rowOrder;

        const isPembayaran = trx.noTransaksi.startsWith('KWI-DB/') || trx.noTransaksi.startsWith('KWI-DU/');
        if (req.body.uraian !== undefined && !isPembayaran) {
            trx.namaSantri = req.body.uraian; 
        }
        
        if (req.body.rincianNames && Array.isArray(req.body.rincianNames)) {
            trx.rincianNames = JSON.stringify(req.body.rincianNames);
        }

        await TransaksiModel.updateTransaksi(id, trx);

        if (req.body.uraian !== undefined) {
            const laporanData = await TransaksiModel.getAllLaporan();
            const lap = laporanData.find(l => l.noTransaksi === trx.noTransaksi);
            if (lap) {
                lap.uraian = req.body.uraian;
                await TransaksiModel.updateLaporanByNoTransaksi(lap.noTransaksi, lap);
            }
        }

        res.json({ success: true, message: 'Kwitansi berhasil diperbarui' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
