// ==========================================
// Admin Controller
// Semua handler route untuk bagian admin/backend
// ==========================================

const {
    dashboardData,
    laporanData,
    tagihanData,
    tunggakanData,
    tagihanDaftarUlangData,
    tunggakanDaftarUlangData,
    santriData,
    santriDaftarUlangData
} = require('../data/mockData');

// ---- Dashboard ----
exports.getDashboard = (req, res) => {
    // === Aggregate Data for Dashboard ===
    
    // 1. Grand Totals (Sebelum Subsidi Ziswaf)
    const targetPendapatanBaruNoZiswaf = tagihanData.reduce((sum, item) => sum + item.totalTagihan, 0);
    const targetPendapatanLamaNoZiswaf = tagihanDaftarUlangData.reduce((sum, item) => sum + item.totalTagihan, 0);
    
    // Hitung Santri Beasiswa Dhuafa / Yatim
    const countBeasiswaBaru = santriData.filter(s => s.jalurPendaftaran === 'Beasiswa Dhuafa' || s.jalurPendaftaran === 'Beasiswa Yatim/Piatu').length;
    const countBeasiswaLama = santriDaftarUlangData.filter(s => s.jalurPendaftaran === 'Beasiswa Dhuafa' || s.jalurPendaftaran === 'Beasiswa Yatim/Piatu').length;
    
    const totalSantriBeasiswa = countBeasiswaBaru + countBeasiswaLama;
    const targetDanaZiswaf = totalSantriBeasiswa * 150000;
    
    // Hitung Realisasi dari Pemasukan dengan kata kunci "ziswaf"
    const realisasiZiswaf = dashboardData.transaksiTerbaru.reduce((sum, trx) => {
        if (trx.jenis === 'Pemasukan' && 
            (trx.namaSantri.toLowerCase().includes('ziswaf') || (trx.uraian && trx.uraian.toLowerCase().includes('ziswaf')))) {
            return sum + trx.nominal;
        }
        return sum;
    }, 0);
    
    const tunggakanZiswaf = Math.max(0, targetDanaZiswaf - realisasiZiswaf);
    
    // Total Target & Tunggakan setelah digabung dengan Ziswaf
    const totalTargetPendapatan = targetPendapatanBaruNoZiswaf + targetPendapatanLamaNoZiswaf + targetDanaZiswaf;
    
    const tunggakanBaruNoZiswaf = tunggakanData.reduce((sum, item) => sum + item.sisaBayar, 0);
    const tunggakanLamaNoZiswaf = tunggakanDaftarUlangData.reduce((sum, item) => sum + item.sisaBayar, 0);
    const totalTunggakan = tunggakanBaruNoZiswaf + tunggakanLamaNoZiswaf + tunggakanZiswaf;
    
    // Total Pemasukan riil global
    const totalPemasukanGlobal = dashboardData.transaksiTerbaru.reduce((sum, trx) => {
        return trx.jenis === 'Pemasukan' ? sum + trx.nominal : sum;
    }, 0);

    // Helper for grouping
    const getUnitStats = (unitPrefix, tghData, tggData, isBaru) => {
        let tagihanGroup = tghData.filter(t => t.satuanPendidikan && t.satuanPendidikan.startsWith(unitPrefix));
        let tunggakanGroup = tggData.filter(t => t.satuanPendidikan && t.satuanPendidikan.startsWith(unitPrefix));
        
        let jumlahSantri = tagihanGroup.length;
        
        // Porsi Ziswaf per unit
        let countBeasiswaUnit = 0;
        if (isBaru) {
            countBeasiswaUnit = santriData.filter(s => 
                (s.jalurPendaftaran === 'Beasiswa Dhuafa' || s.jalurPendaftaran === 'Beasiswa Yatim/Piatu') && 
                s.pendidikan && s.pendidikan.startsWith(unitPrefix)
            ).length;
        } else {
            countBeasiswaUnit = santriDaftarUlangData.filter(s => 
                (s.jalurPendaftaran === 'Beasiswa Dhuafa' || s.jalurPendaftaran === 'Beasiswa Yatim/Piatu') && 
                s.lanjutKe && s.lanjutKe.startsWith(unitPrefix)
            ).length;
        }
        
        let targetZiswafUnit = countBeasiswaUnit * 150000;
        
        // Realisasi Ziswaf per unit
        let realisasiZiswafUnit = dashboardData.transaksiTerbaru.reduce((sum, trx) => {
            if (trx.jenis === 'Pemasukan' && 
                trx.satuanPendidikan === unitPrefix && 
                (trx.namaSantri.toLowerCase().includes('ziswaf') || (trx.uraian && trx.uraian.toLowerCase().includes('ziswaf')))) {
                
                const isTrxLama = trx.namaSantri.toLowerCase().includes('daftar ulang') || 
                                  trx.namaSantri.toLowerCase().includes('lama') || 
                                  trx.namaSantri.toLowerCase().includes('du') ||
                                  (trx.uraian && (trx.uraian.toLowerCase().includes('daftar ulang') || trx.uraian.toLowerCase().includes('lama') || trx.uraian.toLowerCase().includes('du')));
                
                if (isBaru && !isTrxLama) {
                    return sum + trx.nominal;
                } else if (!isBaru && isTrxLama) {
                    return sum + trx.nominal;
                }
            }
            return sum;
        }, 0);
        
        let tunggakanZiswafUnit = Math.max(0, targetZiswafUnit - realisasiZiswafUnit);
        
        let totalTagihan = tagihanGroup.reduce((sum, item) => sum + item.totalTagihan, 0) + targetZiswafUnit;
        let totalBayar = tunggakanGroup.reduce((sum, item) => sum + item.totalBayar, 0) + realisasiZiswafUnit;
        let tunggakan = tunggakanGroup.reduce((sum, item) => sum + item.sisaBayar, 0) + tunggakanZiswafUnit;
        let pengeluaran = 0; // Defaulting to 0 for specific units based on user requirement
        let saldo = totalBayar - pengeluaran;

        let persenTunggakan = totalTagihan > 0 ? (tunggakan / totalTagihan) * 100 : 0;
        let persenBayar = totalTagihan > 0 ? (totalBayar / totalTagihan) * 100 : 0;

        return {
            jumlahSantri,
            totalTagihan,
            totalBayar,
            tunggakan,
            pengeluaran,
            saldo,
            persenTunggakan: persenTunggakan.toFixed(2) + '%',
            persenBayar: persenBayar.toFixed(2) + '%'
        };
    };

    // 2. Unit Specific Stats (Baru)
    const baruPAUDQu = getUnitStats('PAUDQu', tagihanData, tunggakanData, true);
    const baruTPQ = getUnitStats('TPQ', tagihanData, tunggakanData, true);
    const baruMDT = getUnitStats('MDT', tagihanData, tunggakanData, true);

    // Unit Specific Stats (Lama / Daftar Ulang)
    const lamaPAUDQu = getUnitStats('PAUDQu', tagihanDaftarUlangData, tunggakanDaftarUlangData, false);
    const lamaTPQ = getUnitStats('TPQ', tagihanDaftarUlangData, tunggakanDaftarUlangData, false);
    const lamaMDT = getUnitStats('MDT', tagihanDaftarUlangData, tunggakanDaftarUlangData, false);

    // Madrasah (Total)
    const madrasahBaru = {
        jumlahSantri: baruPAUDQu.jumlahSantri + baruTPQ.jumlahSantri + baruMDT.jumlahSantri,
        totalTagihan: baruPAUDQu.totalTagihan + baruTPQ.totalTagihan + baruMDT.totalTagihan,
        totalBayar: baruPAUDQu.totalBayar + baruTPQ.totalBayar + baruMDT.totalBayar,
        tunggakan: baruPAUDQu.tunggakan + baruTPQ.tunggakan + baruMDT.tunggakan,
        pengeluaran: 0,
        saldo: baruPAUDQu.totalBayar + baruTPQ.totalBayar + baruMDT.totalBayar
    };
    madrasahBaru.persenTunggakan = madrasahBaru.totalTagihan > 0 ? ((madrasahBaru.tunggakan / madrasahBaru.totalTagihan) * 100).toFixed(2) + '%' : '0.00%';
    madrasahBaru.persenBayar = madrasahBaru.totalTagihan > 0 ? ((madrasahBaru.totalBayar / madrasahBaru.totalTagihan) * 100).toFixed(2) + '%' : '0.00%';

    const madrasahLama = {
        jumlahSantri: lamaPAUDQu.jumlahSantri + lamaTPQ.jumlahSantri + lamaMDT.jumlahSantri,
        totalTagihan: lamaPAUDQu.totalTagihan + lamaTPQ.totalTagihan + lamaMDT.totalTagihan,
        totalBayar: lamaPAUDQu.totalBayar + lamaTPQ.totalBayar + lamaMDT.totalBayar,
        tunggakan: lamaPAUDQu.tunggakan + lamaTPQ.tunggakan + lamaMDT.tunggakan,
        pengeluaran: 0,
        saldo: lamaPAUDQu.totalBayar + lamaTPQ.totalBayar + lamaMDT.totalBayar
    };
    madrasahLama.persenTunggakan = madrasahLama.totalTagihan > 0 ? ((madrasahLama.tunggakan / madrasahLama.totalTagihan) * 100).toFixed(2) + '%' : '0.00%';
    madrasahLama.persenBayar = madrasahLama.totalTagihan > 0 ? ((madrasahLama.totalBayar / madrasahLama.totalTagihan) * 100).toFixed(2) + '%' : '0.00%';

    const madrasahTotal = {
        jumlahSantri: madrasahBaru.jumlahSantri + madrasahLama.jumlahSantri,
        totalTagihan: madrasahBaru.totalTagihan + madrasahLama.totalTagihan,
        totalBayar: madrasahBaru.totalBayar + madrasahLama.totalBayar,
        tunggakan: madrasahBaru.tunggakan + madrasahLama.tunggakan,
        pengeluaran: 0, // global pengeluaran excluded per user warning
        saldo: madrasahBaru.totalBayar + madrasahLama.totalBayar
    };
    madrasahTotal.persenTunggakan = madrasahTotal.totalTagihan > 0 ? ((madrasahTotal.tunggakan / madrasahTotal.totalTagihan) * 100).toFixed(2) + '%' : '0.00%';
    madrasahTotal.persenBayar = madrasahTotal.totalTagihan > 0 ? ((madrasahTotal.totalBayar / madrasahTotal.totalTagihan) * 100).toFixed(2) + '%' : '0.00%';

    // 3. Rekapitulasi Kelas
    const countKelas = (dataArray, key) => {
        let counts = {
            'PAUDQu A': 0, 'PAUDQu B': 0, 
            'TPQ A': 0, 'TPQ B': 0, 'TPQ C': 0,
            'MDT 1': 0, 'MDT 2': 0, 'MDT 3': 0, 'MDT 4': 0
        };
        dataArray.forEach(item => {
            let k = item[key];
            if (counts[k] !== undefined) counts[k]++;
        });
        return counts;
    };

    const rekapBaru = countKelas(santriData, 'pendidikan');
    const rekapLama = countKelas(santriDaftarUlangData, 'lanjutKe');

    // 4. Rekapitulasi Pengeluaran
    let pengeluaranMadrasah = 0;
    let pengeluaranPAUDQu = 0;
    let pengeluaranTPQ = 0;
    let pengeluaranMDT = 0;

    dashboardData.transaksiTerbaru.forEach(trx => {
        if (trx.jenis === 'Pengeluaran') {
            if (trx.satuanPendidikan === 'PAUDQu') pengeluaranPAUDQu += trx.nominal;
            else if (trx.satuanPendidikan === 'TPQ') pengeluaranTPQ += trx.nominal;
            else if (trx.satuanPendidikan === 'MDT') pengeluaranMDT += trx.nominal;
            else pengeluaranMadrasah += trx.nominal; // Default to Madrasah (Umum)
        }
    });

    const pengeluaranTotal = pengeluaranMadrasah + pengeluaranPAUDQu + pengeluaranTPQ + pengeluaranMDT;
    const pengeluaranRekap = {
        MADRASAH: pengeluaranMadrasah,
        PAUDQu: pengeluaranPAUDQu,
        TPQ: pengeluaranTPQ,
        MDT: pengeluaranMDT,
        TOTAL: pengeluaranTotal
    };

    res.render('dashboard', { 
        data: dashboardData,
        tunggakanList: tunggakanData,
        tunggakanDaftarUlangList: tunggakanDaftarUlangData,
        dashboardStats: {
            totalPemasukanGlobal,
            totalTunggakan,
            totalTargetPendapatan,
            madrasahTotal,
            madrasahBaru,
            madrasahLama,
            baru: { PAUDQu: baruPAUDQu, TPQ: baruTPQ, MDT: baruMDT },
            lama: { PAUDQu: lamaPAUDQu, TPQ: lamaTPQ, MDT: lamaMDT },
            rekapBaru,
            rekapLama,
            pengeluaranRekap,
            ziswafStats: {
                santriBaru: countBeasiswaBaru,
                santriLama: countBeasiswaLama,
                totalSantri: totalSantriBeasiswa,
                targetDana: targetDanaZiswaf,
                realisasiBayar: realisasiZiswaf,
                sisaTunggakan: tunggakanZiswaf
            }
        }
    });
};

// ---- Laporan ----
exports.getLaporan = (req, res) => {
    res.render('laporan', { laporan: laporanData, transaksiTerbaru: dashboardData.transaksiTerbaru });
};

// ---- Tagihan ----
exports.getTagihan = (req, res) => {
    res.render('tagihan', { tagihan: tagihanData, tunggakan: tunggakanData });
};

exports.getTagihanDaftarUlang = (req, res) => {
    res.render('tagihan-daftar-ulang', { tagihan: tagihanDaftarUlangData, tunggakanDaftarUlang: tunggakanDaftarUlangData });
};

exports.editTagihan = (req, res) => {
    const id = parseInt(req.params.id);
    const index = tagihanData.findIndex(s => s.id === id);
    if (index !== -1) {
        tagihanData[index].formulir = parseInt(req.body.formulir) || 0;
        tagihanData[index].uangPangkal = parseInt(req.body.uangPangkal) || 0;
        tagihanData[index].perlengkapan = parseInt(req.body.perlengkapan) || 0;
        tagihanData[index].seragam = parseInt(req.body.seragam) || 0;
        tagihanData[index].spp = parseInt(req.body.spp) || 0;

        tagihanData[index].totalTagihan = tagihanData[index].formulir + tagihanData[index].uangPangkal + tagihanData[index].perlengkapan + tagihanData[index].seragam + tagihanData[index].spp;

        const tIdx = tunggakanData.findIndex(t => t.nama === tagihanData[index].nama);
        if (tIdx !== -1) {
            tunggakanData[tIdx].totalTagihan = tagihanData[index].totalTagihan;
            tunggakanData[tIdx].sisaBayar = tunggakanData[tIdx].totalTagihan - tunggakanData[tIdx].totalBayar;
            if (tunggakanData[tIdx].sisaBayar <= 0) {
                tunggakanData[tIdx].sisaBayar = 0;
                tunggakanData[tIdx].status = 'Lunas';
            } else {
                tunggakanData[tIdx].status = 'Belum Lunas';
            }
        }
    }
    res.redirect('/tagihan');
};

exports.editTagihanDaftarUlang = (req, res) => {
    const id = parseInt(req.params.id);
    const index = tagihanDaftarUlangData.findIndex(s => s.id === id);
    if (index !== -1) {
        tagihanDaftarUlangData[index].formulir = parseInt(req.body.formulir) || 0;
        tagihanDaftarUlangData[index].perlengkapan = parseInt(req.body.perlengkapan) || 0;
        tagihanDaftarUlangData[index].spp = parseInt(req.body.spp) || 0;

        tagihanDaftarUlangData[index].totalTagihan = tagihanDaftarUlangData[index].formulir + tagihanDaftarUlangData[index].uangPangkal + tagihanDaftarUlangData[index].perlengkapan + tagihanDaftarUlangData[index].seragam + tagihanDaftarUlangData[index].spp;

        const tIdx = tunggakanDaftarUlangData.findIndex(t => t.nama === tagihanDaftarUlangData[index].nama);
        if (tIdx !== -1) {
            tunggakanDaftarUlangData[tIdx].totalTagihan = tagihanDaftarUlangData[index].totalTagihan;
            tunggakanDaftarUlangData[tIdx].sisaBayar = tunggakanDaftarUlangData[tIdx].totalTagihan - tunggakanDaftarUlangData[tIdx].totalBayar;
            if (tunggakanDaftarUlangData[tIdx].sisaBayar <= 0) {
                tunggakanDaftarUlangData[tIdx].sisaBayar = 0;
                tunggakanDaftarUlangData[tIdx].status = 'Lunas';
            } else {
                tunggakanDaftarUlangData[tIdx].status = 'Belum Lunas';
            }
        }
    }
    res.redirect('/tagihan-daftar-ulang');
};

// ---- Tunggakan ----
exports.getTunggakan = (req, res) => {
    res.render('tunggakan', { tunggakan: tunggakanData });
};

exports.getTunggakanDaftarUlang = (req, res) => {
    res.render('tunggakan-daftar-ulang', { tunggakan: tunggakanDaftarUlangData });
};

// ---- Santri ----
exports.getSantri = (req, res) => {
    res.render('santri', { santri: santriData });
};

exports.getSantriDaftarUlang = (req, res) => {
    res.render('santri-daftar-ulang', { santri: santriDaftarUlangData });
};

exports.editSantri = (req, res) => {
    const id = parseInt(req.params.id);
    const index = santriData.findIndex(s => s.id === id);
    if(index !== -1) {
        const oldName = santriData[index].nama;
        const oldJalur = santriData[index].jalurPendaftaran;
        const oldPendidikan = santriData[index].pendidikan;
        
        santriData[index] = { ...santriData[index], ...req.body };
        const newName = santriData[index].nama || oldName;
        const newJalur = santriData[index].jalurPendaftaran || oldJalur;
        const newPendidikan = santriData[index].pendidikan || oldPendidikan;
        
        if (req.body.tanggalLahir) {
            const birthDate = new Date(req.body.tanggalLahir);
            santriData[index].usia = 2026 - birthDate.getFullYear();
        }
        if (req.body.teleponAyah) {
            santriData[index].noTelepon = req.body.teleponAyah;
        }
        
        if(oldName !== newName) {
            tagihanData.forEach(t => { if(t.nama === oldName) t.nama = newName; });
            tunggakanData.forEach(t => { if(t.nama === oldName) t.nama = newName; });
            dashboardData.transaksiTerbaru.forEach(t => { if(t.namaSantri === oldName) t.namaSantri = newName; });
        }
        
        if (oldJalur !== newJalur || oldPendidikan !== newPendidikan) {
            const tagihan = tagihanData.find(t => t.nama === newName);
            if (tagihan) {
                tagihan.jalur = newJalur;
                tagihan.satuanPendidikan = newPendidikan;
                
                const eduPrefix = newPendidikan ? newPendidikan.split(' ')[0] : 'PAUDQu';
                tagihan.formulir = 100000;
                tagihan.uangPangkal = 250000;
                tagihan.spp = 150000;

                if (eduPrefix === 'PAUDQu') {
                    tagihan.seragam = 800000;
                    tagihan.perlengkapan = 700000;
                } else if (eduPrefix === 'TPQ') {
                    tagihan.seragam = 750000;
                    tagihan.perlengkapan = 500000;
                } else {
                    tagihan.seragam = 700000;
                    tagihan.perlengkapan = 600000;
                }

                if (newJalur === 'Beasiswa Dhuafa') {
                    tagihan.formulir = 0;
                    tagihan.uangPangkal = 0;
                    tagihan.spp = 0;
                } else if (newJalur === 'Beasiswa Yatim/Piatu') {
                    tagihan.formulir = 0;
                    tagihan.uangPangkal = 0;
                    tagihan.spp = 0;
                    tagihan.seragam = 0;
                    tagihan.perlengkapan = 0;
                } else if (newJalur === 'Beasiswa Pegawai/Komunitas JIC' || newJalur === 'Beasiswa Satu Keluarga') {
                    tagihan.formulir = 0;
                    tagihan.uangPangkal = 0;
                }

                tagihan.totalTagihan = tagihan.formulir + tagihan.uangPangkal + tagihan.perlengkapan + tagihan.seragam + tagihan.spp;

                const tunggakan = tunggakanData.find(t => t.nama === newName);
                if (tunggakan) {
                    tunggakan.satuanPendidikan = newPendidikan;
                    tunggakan.totalTagihan = tagihan.totalTagihan;
                    tunggakan.sisaBayar = tagihan.totalTagihan - tunggakan.totalBayar;
                    tunggakan.status = tunggakan.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
                }
            }
        }
    }
    res.redirect('/santri');
};

exports.editSantriDaftarUlang = (req, res) => {
    const id = parseInt(req.params.id);
    const index = santriDaftarUlangData.findIndex(s => s.id === id);
    if (index !== -1) {
        const oldName = santriDaftarUlangData[index].nama;
        const oldJalur = santriDaftarUlangData[index].jalurPendaftaran;
        const oldUnitSebelumnya = santriDaftarUlangData[index].unitSebelumnya;
        const oldLanjutKe = santriDaftarUlangData[index].lanjutKe;

        santriDaftarUlangData[index] = { ...santriDaftarUlangData[index], ...req.body };
        const newName = santriDaftarUlangData[index].nama || oldName;
        const newJalur = santriDaftarUlangData[index].jalurPendaftaran || oldJalur;
        const newUnitSebelumnya = santriDaftarUlangData[index].unitSebelumnya || oldUnitSebelumnya;
        const newLanjutKe = santriDaftarUlangData[index].lanjutKe || oldLanjutKe;

        if (req.body.tanggalLahir) {
            const birthDate = new Date(req.body.tanggalLahir);
            santriDaftarUlangData[index].usia = 2026 - birthDate.getFullYear();
        }
        if (req.body.teleponAyah) {
            santriDaftarUlangData[index].noTelepon = req.body.teleponAyah;
        }

        if (oldName !== newName) {
            tagihanDaftarUlangData.forEach(t => { if (t.nama === oldName) t.nama = newName; });
            tunggakanDaftarUlangData.forEach(t => { if (t.nama === oldName) t.nama = newName; });
            dashboardData.transaksiTerbaru.forEach(t => { if (t.namaSantri === oldName) t.namaSantri = newName; });
        }

        if (oldJalur !== newJalur || oldUnitSebelumnya !== newUnitSebelumnya || oldLanjutKe !== newLanjutKe) {
            const tagihan = tagihanDaftarUlangData.find(t => t.nama === newName);
            if (tagihan) {
                tagihan.jalur = newJalur;
                tagihan.satuanPendidikanSebelumnya = newUnitSebelumnya;
                tagihan.satuanPendidikan = newLanjutKe;

                const eduPrefix = newLanjutKe ? newLanjutKe.split(' ')[0] : 'PAUDQu';
                tagihan.formulir = 100000;
                tagihan.perlengkapan = eduPrefix === 'PAUDQu' ? 700000 : 600000;
                tagihan.spp = 150000;
                tagihan.uangPangkal = 0;
                tagihan.seragam = 0;

                if (newJalur === 'Beasiswa Dhuafa') {
                    tagihan.formulir = 0;
                    tagihan.spp = 0;
                } else if (newJalur === 'Beasiswa Yatim/Piatu') {
                    tagihan.formulir = 0;
                    tagihan.perlengkapan = 0;
                    tagihan.spp = 0;
                }

                tagihan.totalTagihan = tagihan.formulir + tagihan.uangPangkal + tagihan.perlengkapan + tagihan.seragam + tagihan.spp;

                const tunggakan = tunggakanDaftarUlangData.find(t => t.nama === newName);
                if (tunggakan) {
                    tunggakan.satuanPendidikan = newLanjutKe;
                    tunggakan.totalTagihan = tagihan.totalTagihan;
                    tunggakan.sisaBayar = tagihan.totalTagihan - tunggakan.totalBayar;
                    tunggakan.status = tunggakan.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
                }
            }
        }
    }
    res.redirect('/santri-daftar-ulang');
};

exports.deleteSantri = (req, res) => {
    const id = parseInt(req.params.id);
    const index = santriData.findIndex(s => s.id === id);
    if (index !== -1) {
        const deletedName = santriData[index].nama;
        santriData.splice(index, 1);

        const tIdx = tagihanData.findIndex(t => t.nama === deletedName);
        if (tIdx !== -1) tagihanData.splice(tIdx, 1);

        const tuIdx = tunggakanData.findIndex(t => t.nama === deletedName);
        if (tuIdx !== -1) tunggakanData.splice(tuIdx, 1);
    }
    res.redirect('/santri');
};

exports.deleteSantriDaftarUlang = (req, res) => {
    const id = parseInt(req.params.id);
    const index = santriDaftarUlangData.findIndex(s => s.id === id);
    if (index !== -1) {
        const deletedName = santriDaftarUlangData[index].nama;
        santriDaftarUlangData.splice(index, 1);

        const tIdx = tagihanDaftarUlangData.findIndex(t => t.nama === deletedName);
        if (tIdx !== -1) tagihanDaftarUlangData.splice(tIdx, 1);

        const tuIdx = tunggakanDaftarUlangData.findIndex(t => t.nama === deletedName);
        if (tuIdx !== -1) tunggakanDaftarUlangData.splice(tuIdx, 1);
    }
    res.redirect('/santri-daftar-ulang');
};

// ---- Input Transaksi ----
exports.getInputTransaksi = (req, res) => {
    // success=true jika di-redirect dari post
    const success = req.query.success === 'true';
    const error = req.query.error;
    res.render('input-transaksi', {
        success,
        error,
        tunggakan: tunggakanData,
        tunggakanDaftarUlang: tunggakanDaftarUlangData,
        santri: santriData,
        santriDaftarUlang: santriDaftarUlangData,
        data: dashboardData
    });
};

exports.postInputTransaksi = (req, res) => {
    const { tanggal, jenisTransaksi, namaPendaftar, satuanPendidikan, namaSantriDaftarUlang, uraianLain, nominal, satuanPendidikanPengeluaran, metodePembayaran } = req.body;
    const nominalBayar = parseInt(nominal) || 0;

    // VALIDASI SALDO
    if (jenisTransaksi === 'Pengeluaran') {
        let currentTotalPemasukan = 0;
        let currentTotalPengeluaran = 0;
        dashboardData.transaksiTerbaru.forEach(t => {
            if (t.jenis === 'Pemasukan') currentTotalPemasukan += t.nominal;
            else if (t.jenis === 'Pengeluaran') currentTotalPengeluaran += t.nominal;
        });
        const saldoSaatIni = currentTotalPemasukan - currentTotalPengeluaran;
        if (nominalBayar > saldoSaatIni) {
            return res.redirect('/input-transaksi?error=Saldo+tidak+mencukupi+untuk+pengeluaran+ini.+Sisa+saldo:+Rp+' + saldoSaatIni.toLocaleString('id-ID'));
        }
    }

    // Generate simple ID
    const newId = dashboardData.transaksiTerbaru.length > 0 ? Math.max(...dashboardData.transaksiTerbaru.map(t => t.id)) + 1 : 1;
    let noTransaksi = '';
    let namaSantri = '-';
    let uraian = uraianLain || '';
    let jenis = 'Pemasukan';
    let pemasukan = 0;
    let pengeluaran = 0;
    let satPendTrx = '';

    // Parse date for Laporan
    const dateObj = new Date(tanggal || Date.now());
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const bulan = months[dateObj.getMonth()];
    const tahun = dateObj.getFullYear();
    const formattedTanggal = `${dateObj.getDate().toString().padStart(2, '0')} ${bulan} ${tahun}`;

    if (jenisTransaksi === 'Pembayaran Pendaftaran Baru' && namaPendaftar) {
        namaSantri = namaPendaftar;
        uraian = 'Pembayaran Pendaftaran Baru ' + namaPendaftar;
        
        // Generate noTransaksi
        const prefixStr = `KWI-DB/SPMB-MJIC/${tahun}/`;
        let maxSeq = 0;
        dashboardData.transaksiTerbaru.forEach(t => {
            if (t.noTransaksi && t.noTransaksi.startsWith(prefixStr)) {
                const parts = t.noTransaksi.split('/');
                const lastPart = parts[parts.length - 1];
                const seqNum = parseInt(lastPart, 10);
                if (!isNaN(seqNum) && seqNum > maxSeq) {
                    maxSeq = seqNum;
                }
            }
        });
        const nextSeq = maxSeq + 1;
        noTransaksi = `${prefixStr}${String(nextSeq).padStart(4, '0')}`;

        pemasukan = nominalBayar;
        const t = tunggakanData.find(item => item.nama === namaPendaftar);
        if (t) {
            satPendTrx = t.satuanPendidikan;
            t.totalBayar += nominalBayar;
            t.sisaBayar = t.totalTagihan - t.totalBayar;
            if (t.sisaBayar <= 0) {
                t.sisaBayar = 0;
                t.status = 'Lunas';
            }
        }
    } else if (jenisTransaksi === 'Pembayaran Daftar Ulang' && namaSantriDaftarUlang) {
        namaSantri = namaSantriDaftarUlang;
        uraian = 'Pembayaran Daftar Ulang ' + namaSantriDaftarUlang;
        
        // Generate noTransaksi
        const prefixStr = `KWI-DU/SPMB-MJIC/${tahun}/`;
        let maxSeq = 0;
        dashboardData.transaksiTerbaru.forEach(t => {
            if (t.noTransaksi && t.noTransaksi.startsWith(prefixStr)) {
                const parts = t.noTransaksi.split('/');
                const lastPart = parts[parts.length - 1];
                const seqNum = parseInt(lastPart, 10);
                if (!isNaN(seqNum) && seqNum > maxSeq) {
                    maxSeq = seqNum;
                }
            }
        });
        const nextSeq = maxSeq + 1;
        noTransaksi = `${prefixStr}${String(nextSeq).padStart(4, '0')}`;

        pemasukan = nominalBayar;
        const t = tunggakanDaftarUlangData.find(item => item.nama === namaSantriDaftarUlang);
        if (t) {
            satPendTrx = t.satuanPendidikan;
            t.totalBayar += nominalBayar;
            t.sisaBayar = t.totalTagihan - t.totalBayar;
            if (t.sisaBayar <= 0) {
                t.sisaBayar = 0;
                t.status = 'Lunas';
            }
        }
    } else if (jenisTransaksi === 'Pemasukan') {
        jenis = 'Pemasukan';
        
        // Generate noTransaksi
        const prefixStr = `DEB/SPMB-MJIC/${tahun}/`;
        let maxSeq = 0;
        dashboardData.transaksiTerbaru.forEach(t => {
            if (t.noTransaksi && t.noTransaksi.startsWith(prefixStr)) {
                const parts = t.noTransaksi.split('/');
                const lastPart = parts[parts.length - 1];
                const seqNum = parseInt(lastPart, 10);
                if (!isNaN(seqNum) && seqNum > maxSeq) {
                    maxSeq = seqNum;
                }
            }
        });
        const nextSeq = maxSeq + 1;
        noTransaksi = `${prefixStr}${String(nextSeq).padStart(4, '0')}`;

        pemasukan = nominalBayar;
        namaSantri = uraian || 'Pemasukan Lainnya';
    } else if (jenisTransaksi === 'Pengeluaran') {
        jenis = 'Pengeluaran';
        
        // Generate noTransaksi
        const prefixStr = `KRE/SPMB-MJIC/${tahun}/`;
        let maxSeq = 0;
        dashboardData.transaksiTerbaru.forEach(t => {
            if (t.noTransaksi && t.noTransaksi.startsWith(prefixStr)) {
                const parts = t.noTransaksi.split('/');
                const lastPart = parts[parts.length - 1];
                const seqNum = parseInt(lastPart, 10);
                if (!isNaN(seqNum) && seqNum > maxSeq) {
                    maxSeq = seqNum;
                }
            }
        });
        const nextSeq = maxSeq + 1;
        noTransaksi = `${prefixStr}${String(nextSeq).padStart(4, '0')}`;

        pengeluaran = nominalBayar;
        namaSantri = uraian || 'Pengeluaran Lainnya';
    }

    if (jenis === 'Pengeluaran') {
        satPendTrx = satuanPendidikanPengeluaran || 'MADRASAH';
    } else if (jenis === 'Pemasukan' && !satPendTrx) {
        satPendTrx = 'MADRASAH';
    }

    // Add to transaksi terbaru (at the beginning)
    dashboardData.transaksiTerbaru.unshift({
        id: newId,
        tanggal: formattedTanggal,
        noTransaksi,
        namaSantri,
        jenis,
        nominal: nominalBayar,
        satuanPendidikan: satPendTrx,
        metodePembayaran: metodePembayaran || 'Cash',
        dibayarkanKepada: req.body.dibayarkanKepada || '',
        kategoriDana: req.body.kategoriDana === 'Lainnya' ? (req.body.kategoriDanaLainnya || 'Lainnya') : (req.body.kategoriDana || ''),
        rincianNames: req.body.rincianNames ? (Array.isArray(req.body.rincianNames) ? req.body.rincianNames : [req.body.rincianNames]) : [],
        rincianNominals: req.body.rincianNominals ? (Array.isArray(req.body.rincianNominals) ? req.body.rincianNominals : [req.body.rincianNominals]) : [],
        diterimaDari: req.body.diterimaDari || '',
        namaPemberi: req.body.namaPemberi || ''
    });

    // Add to Laporan (at the end)
    laporanData.push({
        tanggal: formattedTanggal,
        bulan,
        tahun: tahun.toString(),
        noTransaksi,
        uraian,
        pemasukan,
        pengeluaran
    });

    // Global dashboard amounts are now calculated dynamically

    res.redirect('/input-transaksi?success=true');
};

exports.deleteTransaksi = (req, res) => {
    const id = parseInt(req.params.id);
    const trxIndex = dashboardData.transaksiTerbaru.findIndex(t => t.id === id);
    if (trxIndex !== -1) {
        const trx = dashboardData.transaksiTerbaru[trxIndex];

        // Remove from dashboardData.transaksiTerbaru
        dashboardData.transaksiTerbaru.splice(trxIndex, 1);

        // Find and remove from laporanData
        const lapIndex = laporanData.findIndex(l => l.noTransaksi === trx.noTransaksi);
        if (lapIndex !== -1) {
            laporanData.splice(lapIndex, 1);
        }

        // Global totals are now calculated dynamically

        // Revert tunggakan/tunggakanDaftarUlang if applicable
        if (trx.noTransaksi.startsWith('KWI-DB/')) {
            const t = tunggakanData.find(item => item.nama === trx.namaSantri);
            if (t) {
                t.totalBayar -= trx.nominal;
                t.sisaBayar = t.totalTagihan - t.totalBayar;
                t.status = t.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
            }
        } else if (trx.noTransaksi.startsWith('KWI-DU/')) {
            const t = tunggakanDaftarUlangData.find(item => item.nama === trx.namaSantri);
            if (t) {
                t.totalBayar -= trx.nominal;
                t.sisaBayar = t.totalTagihan - t.totalBayar;
                t.status = t.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
            }
        }
    }
    res.redirect('/input-transaksi');
};

exports.editTransaksi = (req, res) => {
    const id = parseInt(req.params.id);
    const { tanggal, nominal, metodePembayaran } = req.body;
    const nominalBaru = parseInt(nominal) || 0;

    const trxIndex = dashboardData.transaksiTerbaru.findIndex(t => t.id === id);
    if (trxIndex !== -1) {
        const trx = dashboardData.transaksiTerbaru[trxIndex];
        const selisih = nominalBaru - trx.nominal;

        // Update tunggakan if it's a payment
        if (trx.noTransaksi.startsWith('KWI-DB/')) {
            const t = tunggakanData.find(item => item.nama === trx.namaSantri);
            if (t) {
                t.totalBayar += selisih;
                t.sisaBayar = t.totalTagihan - t.totalBayar;
                t.status = t.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
            }
        } else if (trx.noTransaksi.startsWith('KWI-DU/')) {
            const t = tunggakanDaftarUlangData.find(item => item.nama === trx.namaSantri);
            if (t) {
                t.totalBayar += selisih;
                t.sisaBayar = t.totalTagihan - t.totalBayar;
                t.status = t.sisaBayar <= 0 ? 'Lunas' : 'Belum Lunas';
            }
        }

        // Update transaction
        if (tanggal) {
            trx.tanggal = tanggal;
        }
        trx.nominal = nominalBaru;
        if (metodePembayaran) {
            trx.metodePembayaran = metodePembayaran;
        }

        // Update laporan data if exists
        const lap = laporanData.find(l => l.noTransaksi === trx.noTransaksi);
        if (lap) {
            if (tanggal) lap.tanggal = tanggal;
            if (trx.jenis === 'Pemasukan') {
                lap.pemasukan = nominalBaru;
            } else {
                lap.pengeluaran = nominalBaru;
            }
        }
    }
    res.redirect('/input-transaksi');
};

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

// ---- Kwitansi ----
exports.getKwitansi = (req, res) => {
    const id = parseInt(req.params.id);
    const trx = dashboardData.transaksiTerbaru.find(t => t.id === id);

    if (!trx) {
        return res.status(404).send('Transaksi tidak ditemukan');
    }

    // Tentukan apakah tipe Pembayaran (DB / DU), Pemasukan Lainnya, atau Pengeluaran
    const isPembayaran = trx.noTransaksi.startsWith('KWI-DB/') || trx.noTransaksi.startsWith('KWI-DU/');
    const isPengeluaran = trx.jenis === 'Pengeluaran';

    let namaWali = '-';
    let namaSantri = '-';
    let satuanPendidikan = '-';
    let jalurPendaftaran = '-';
    let uraianPembayaran = trx.namaSantri;

    // Cari detail santri jika jenisnya Pembayaran
    if (isPembayaran) {
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
        
        // Cari uraian asli dari data laporan jika ada
        const lap = laporanData.find(l => l.noTransaksi === trx.noTransaksi);
        if (lap) {
            uraianPembayaran = lap.uraian;
        }
    } else {
        const lap = laporanData.find(l => l.noTransaksi === trx.noTransaksi);
        if (lap) {
            uraianPembayaran = lap.uraian;
        }
        satuanPendidikan = trx.satuanPendidikan || 'MADRASAH';
    }

    const terbilangStr = terbilangIndo(trx.nominal);
    const nominalFormat = trx.nominal.toLocaleString('id-ID');
    const namaPetugas = 'Henny Maulida Putri, S.Pd.';

    res.render('kwitansi', {
        no_transaksi: trx.noTransaksi,
        nama_wali: namaWali,
        nama_santri: namaSantri,
        satuan_pendidikan: satuanPendidikan,
        jalur_pendaftaran: jalurPendaftaran,
        uraian_pembayaran: uraianPembayaran,
        terbilang: terbilangStr,
        nominal_format: nominalFormat,
        tanggal_cetak: trx.tanggal, // Menyesuaikan tanggal transaksi yang diinput admin
        nama_petugas: namaPetugas,
        is_pembayaran: isPembayaran,
        is_pengeluaran: isPengeluaran,
        dibayarkanKepada: trx.dibayarkanKepada || '',
        kategoriDana: trx.kategoriDana || '',
        rincianNames: trx.rincianNames || [],
        rincianNominals: trx.rincianNominals || [],
        diterimaDari: trx.diterimaDari || '',
        namaPemberi: trx.namaPemberi || '',
        docTitle: trx.docTitle || '',
        diterimaDariPembayaran: trx.diterimaDariPembayaran || '',
        dibayarkanKepadaSign: trx.dibayarkanKepadaSign || '',
        layoutMarginTop: trx.layoutMarginTop || '6.5cm',
        layoutMarginLeft: trx.layoutMarginLeft || '2.5cm',
        ttdVisible: trx.ttdVisible !== false,
        ttdWidth: trx.ttdWidth || '120px',
        ttdX: trx.ttdX || 0,
        ttdY: trx.ttdY || 0,
        rowOrder: trx.rowOrder || null
    });
};

exports.editKwitansiDetail = (req, res) => {
    const id = parseInt(req.params.id);
    const trx = dashboardData.transaksiTerbaru.find(t => t.id === id);

    if (!trx) {
        return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }

    // Update fields if provided
    if (req.body.dibayarkanKepada !== undefined) trx.dibayarkanKepada = req.body.dibayarkanKepada;
    if (req.body.kategoriDana !== undefined) trx.kategoriDana = req.body.kategoriDana;
    if (req.body.diterimaDari !== undefined) trx.diterimaDari = req.body.diterimaDari;
    if (req.body.namaPemberi !== undefined) trx.namaPemberi = req.body.namaPemberi;
    
    if (req.body.docTitle !== undefined) trx.docTitle = req.body.docTitle;
    if (req.body.diterimaDariPembayaran !== undefined) trx.diterimaDariPembayaran = req.body.diterimaDariPembayaran;
    if (req.body.dibayarkanKepadaSign !== undefined) trx.dibayarkanKepadaSign = req.body.dibayarkanKepadaSign;
    if (req.body.layoutMarginTop !== undefined) trx.layoutMarginTop = req.body.layoutMarginTop;
    if (req.body.layoutMarginLeft !== undefined) trx.layoutMarginLeft = req.body.layoutMarginLeft;
    if (req.body.ttdVisible !== undefined) trx.ttdVisible = req.body.ttdVisible;
    if (req.body.ttdWidth !== undefined) trx.ttdWidth = req.body.ttdWidth;
    if (req.body.ttdX !== undefined) trx.ttdX = req.body.ttdX;
    if (req.body.ttdY !== undefined) trx.ttdY = req.body.ttdY;
    if (req.body.rowOrder !== undefined) trx.rowOrder = req.body.rowOrder;

    // Special logic for updating "uraian" in Laporan
    // We only update Laporan if the transaction is Pengeluaran or Pemasukan Lainnya (where namaSantri maps to uraian)
    const isPembayaran = trx.noTransaksi.startsWith('KWI-DB/') || trx.noTransaksi.startsWith('KWI-DU/');
    if (req.body.uraian !== undefined && !isPembayaran) {
        trx.namaSantri = req.body.uraian; // For Pemasukan/Pengeluaran, uraian is stored in namaSantri
    }
    
    if (req.body.rincianNames && Array.isArray(req.body.rincianNames)) {
        trx.rincianNames = req.body.rincianNames;
    }

    // Special logic for updating "uraian" in Laporan
    // Wait, for Pembayaran Santri, uraian is in Laporan as well. So let's update Laporan unconditionally if uraian is provided.
    if (req.body.uraian !== undefined) {
        const lap = laporanData.find(l => l.noTransaksi === trx.noTransaksi);
        if (lap) {
            lap.uraian = req.body.uraian;
        }
    }

    res.json({ success: true, message: 'Kwitansi berhasil diperbarui' });
};
