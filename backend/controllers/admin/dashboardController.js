const SantriModel = require('../../models/SantriModel');
const TagihanModel = require('../../models/TagihanModel');
const TunggakanModel = require('../../models/TunggakanModel');
const TransaksiModel = require('../../models/TransaksiModel');
const xlsx = require('xlsx');

async function generateDashboardStats(startDate, endDate) {
    let santriData = await SantriModel.getAllSantri();
    let santriDaftarUlangData = await SantriModel.getAllSantriDaftarUlang();
    let tagihanData = await TagihanModel.getAllTagihan();
    let tagihanDaftarUlangData = await TagihanModel.getAllTagihanDaftarUlang();
    let tunggakanData = await TunggakanModel.getAllTunggakan();
    let tunggakanDaftarUlangData = await TunggakanModel.getAllTunggakanDaftarUlang();
    
    const filterTanggal = { start: startDate, end: endDate };

    if (startDate && endDate) {
        santriData = santriData.filter(s => {
            if (!s.timestamp) return false;
            const tDate = s.timestamp.substring(0, 10);
            return tDate >= startDate && tDate <= endDate;
        });
        santriDaftarUlangData = santriDaftarUlangData.filter(s => {
            if (!s.timestamp) return false;
            const tDate = s.timestamp.substring(0, 10);
            return tDate >= startDate && tDate <= endDate;
        });

        const validNamesBaru = new Set(santriData.map(s => s.nama));
        const validNamesLama = new Set(santriDaftarUlangData.map(s => s.nama));

        tagihanData = tagihanData.filter(t => validNamesBaru.has(t.nama));
        tunggakanData = tunggakanData.filter(t => validNamesBaru.has(t.nama));
        tagihanDaftarUlangData = tagihanDaftarUlangData.filter(t => validNamesLama.has(t.nama));
        tunggakanDaftarUlangData = tunggakanDaftarUlangData.filter(t => validNamesLama.has(t.nama));
    }

    const targetPendapatanBaruNoZiswaf = tagihanData.reduce((sum, item) => sum + (Number(item.totalTagihan) || 0), 0);
    const targetPendapatanLamaNoZiswaf = tagihanDaftarUlangData.reduce((sum, item) => sum + (Number(item.totalTagihan) || 0), 0);
    
    const countBeasiswaBaru = santriData.filter(s => s.jalurPendaftaran === 'Beasiswa Dhuafa' || s.jalurPendaftaran === 'Beasiswa Yatim/Piatu').length;
    const countBeasiswaLama = santriDaftarUlangData.filter(s => s.jalurPendaftaran === 'Beasiswa Dhuafa' || s.jalurPendaftaran === 'Beasiswa Yatim/Piatu').length;
    
    const totalSantriBeasiswa = countBeasiswaBaru + countBeasiswaLama;
    const targetDanaZiswaf = totalSantriBeasiswa * 150000;
    
    const realisasiZiswaf = await TransaksiModel.getRealisasiZiswafGlobal(filterTanggal);
    const overallRealisasiZiswaf = await TransaksiModel.getRealisasiZiswafGlobal();
    const tunggakanZiswaf = Math.max(0, targetDanaZiswaf - overallRealisasiZiswaf);
    
    const totalTargetPendapatan = targetPendapatanBaruNoZiswaf + targetPendapatanLamaNoZiswaf + targetDanaZiswaf;
    
    const tunggakanBaruNoZiswaf = tunggakanData.reduce((sum, item) => sum + (Number(item.sisaBayar) || 0), 0);
    const tunggakanLamaNoZiswaf = tunggakanDaftarUlangData.reduce((sum, item) => sum + (Number(item.sisaBayar) || 0), 0);
    const totalTunggakan = tunggakanBaruNoZiswaf + tunggakanLamaNoZiswaf + tunggakanZiswaf;
    
    const totalPemasukanGlobal = await TransaksiModel.getTotalPemasukanGlobal(filterTanggal);

    const getUnitStats = async (unitPrefix, tghData, tggData, isBaru) => {
        let tagihanGroup = tghData.filter(t => t.satuanPendidikan && t.satuanPendidikan.startsWith(unitPrefix));
        let tunggakanGroup = tggData.filter(t => t.satuanPendidikan && t.satuanPendidikan.startsWith(unitPrefix));
        
        let jumlahSantri = tagihanGroup.length;
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
        let realisasiZiswafUnit = await TransaksiModel.getRealisasiZiswafByUnit(unitPrefix, isBaru, filterTanggal);
        let overallRealisasiZiswafUnit = await TransaksiModel.getRealisasiZiswafByUnit(unitPrefix, isBaru);
        let tunggakanZiswafUnit = Math.max(0, targetZiswafUnit - overallRealisasiZiswafUnit);
        
        let totalTagihan = tagihanGroup.reduce((sum, item) => sum + (Number(item.totalTagihan) || 0), 0) + targetZiswafUnit;
        
        let regularBayarUnit = await TransaksiModel.getRealisasiBayarByUnit(unitPrefix, isBaru, filterTanggal);
        let totalBayar = regularBayarUnit + realisasiZiswafUnit;
        
        let tunggakan = tunggakanGroup.reduce((sum, item) => sum + (Number(item.sisaBayar) || 0), 0) + tunggakanZiswafUnit;
        
        let pengeluaran = await TransaksiModel.getPengeluaranByUnit(unitPrefix, filterTanggal);
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

    const baruPAUDQu = await getUnitStats('PAUDQu', tagihanData, tunggakanData, true);
    const baruTPQ = await getUnitStats('TPQ', tagihanData, tunggakanData, true);
    const baruMDT = await getUnitStats('MDT', tagihanData, tunggakanData, true);

    const lamaPAUDQu = await getUnitStats('PAUDQu', tagihanDaftarUlangData, tunggakanDaftarUlangData, false);
    const lamaTPQ = await getUnitStats('TPQ', tagihanDaftarUlangData, tunggakanDaftarUlangData, false);
    const lamaMDT = await getUnitStats('MDT', tagihanDaftarUlangData, tunggakanDaftarUlangData, false);

    const madrasahBaru = {
        jumlahSantri: baruPAUDQu.jumlahSantri + baruTPQ.jumlahSantri + baruMDT.jumlahSantri,
        totalTagihan: baruPAUDQu.totalTagihan + baruTPQ.totalTagihan + baruMDT.totalTagihan,
        totalBayar: baruPAUDQu.totalBayar + baruTPQ.totalBayar + baruMDT.totalBayar,
        tunggakan: baruPAUDQu.tunggakan + baruTPQ.tunggakan + baruMDT.tunggakan,
        pengeluaran: baruPAUDQu.pengeluaran + baruTPQ.pengeluaran + baruMDT.pengeluaran,
        saldo: (baruPAUDQu.totalBayar + baruTPQ.totalBayar + baruMDT.totalBayar) - (baruPAUDQu.pengeluaran + baruTPQ.pengeluaran + baruMDT.pengeluaran)
    };
    madrasahBaru.persenTunggakan = madrasahBaru.totalTagihan > 0 ? ((madrasahBaru.tunggakan / madrasahBaru.totalTagihan) * 100).toFixed(2) + '%' : '0.00%';
    madrasahBaru.persenBayar = madrasahBaru.totalTagihan > 0 ? ((madrasahBaru.totalBayar / madrasahBaru.totalTagihan) * 100).toFixed(2) + '%' : '0.00%';

    const madrasahLama = {
        jumlahSantri: lamaPAUDQu.jumlahSantri + lamaTPQ.jumlahSantri + lamaMDT.jumlahSantri,
        totalTagihan: lamaPAUDQu.totalTagihan + lamaTPQ.totalTagihan + lamaMDT.totalTagihan,
        totalBayar: lamaPAUDQu.totalBayar + lamaTPQ.totalBayar + lamaMDT.totalBayar,
        tunggakan: lamaPAUDQu.tunggakan + lamaTPQ.tunggakan + lamaMDT.tunggakan,
        pengeluaran: lamaPAUDQu.pengeluaran + lamaTPQ.pengeluaran + lamaMDT.pengeluaran,
        saldo: (lamaPAUDQu.totalBayar + lamaTPQ.totalBayar + lamaMDT.totalBayar) - (lamaPAUDQu.pengeluaran + lamaTPQ.pengeluaran + lamaMDT.pengeluaran)
    };
    madrasahLama.persenTunggakan = madrasahLama.totalTagihan > 0 ? ((madrasahLama.tunggakan / madrasahLama.totalTagihan) * 100).toFixed(2) + '%' : '0.00%';
    madrasahLama.persenBayar = madrasahLama.totalTagihan > 0 ? ((madrasahLama.totalBayar / madrasahLama.totalTagihan) * 100).toFixed(2) + '%' : '0.00%';

    const madrasahTotal = {
        jumlahSantri: madrasahBaru.jumlahSantri + madrasahLama.jumlahSantri,
        totalTagihan: madrasahBaru.totalTagihan + madrasahLama.totalTagihan,
        totalBayar: madrasahBaru.totalBayar + madrasahLama.totalBayar,
        tunggakan: madrasahBaru.tunggakan + madrasahLama.tunggakan,
        pengeluaran: madrasahBaru.pengeluaran + madrasahLama.pengeluaran, 
        saldo: madrasahBaru.totalBayar + madrasahLama.totalBayar - (madrasahBaru.pengeluaran + madrasahLama.pengeluaran)
    };
    madrasahTotal.persenTunggakan = madrasahTotal.totalTagihan > 0 ? ((madrasahTotal.tunggakan / madrasahTotal.totalTagihan) * 100).toFixed(2) + '%' : '0.00%';
    madrasahTotal.persenBayar = madrasahTotal.totalTagihan > 0 ? ((madrasahTotal.totalBayar / madrasahTotal.totalTagihan) * 100).toFixed(2) + '%' : '0.00%';

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

    const pengeluaranRekap = await TransaksiModel.getPengeluaranRekap(filterTanggal);

    return {
        tunggakanData,
        tunggakanDaftarUlangData,
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
    };
}

exports.getDashboard = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        const filterTanggal = { start: startDate, end: endDate };

        const { tunggakanData, tunggakanDaftarUlangData, dashboardStats } = await generateDashboardStats(startDate, endDate);

        const transaksiTerbaru = await TransaksiModel.getTransaksiPaginated(limit, offset, '', filterTanggal, '');
        const totalData = await TransaksiModel.getTotalTransaksi('', filterTanggal, '');
        const totalPages = Math.ceil(totalData / limit);

        res.render('dashboard', { 
            data: { transaksiTerbaru },
            currentPage: page,
            totalPages: totalPages,
            totalData: totalData,
            startDateQuery: startDate,
            endDateQuery: endDate,
            tunggakanList: tunggakanData,
            tunggakanDaftarUlangList: tunggakanDaftarUlangData,
            dashboardStats: dashboardStats
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.exportDashboardExcel = async (req, res) => {
    try {
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';

        const { dashboardStats } = await generateDashboardStats(startDate, endDate);

        const wb = xlsx.utils.book_new();

        // Sheet 1: Ringkasan Utama
        const wsRingkasanData = [
            { 'Indikator': 'Total Pendapatan (Realisasi)', 'Nilai': dashboardStats.totalPemasukanGlobal },
            { 'Indikator': 'Total Tunggakan', 'Nilai': dashboardStats.totalTunggakan },
            { 'Indikator': 'Total Target Pendapatan', 'Nilai': dashboardStats.totalTargetPendapatan },
            { 'Indikator': '', 'Nilai': '' },
            { 'Indikator': 'Ziswaf - Total Santri Beasiswa', 'Nilai': dashboardStats.ziswafStats.totalSantri },
            { 'Indikator': 'Ziswaf - Target Dana', 'Nilai': dashboardStats.ziswafStats.targetDana },
            { 'Indikator': 'Ziswaf - Realisasi', 'Nilai': dashboardStats.ziswafStats.realisasiBayar },
            { 'Indikator': 'Ziswaf - Tunggakan', 'Nilai': dashboardStats.ziswafStats.sisaTunggakan }
        ];
        const wsRingkasan = xlsx.utils.json_to_sheet(wsRingkasanData);
        xlsx.utils.book_append_sheet(wb, wsRingkasan, 'Ringkasan Utama');

        // Helper for mapping unit to row
        const mapUnitToRow = (unitName, data) => ({
            'Unit': unitName,
            'Jumlah Santri': data.jumlahSantri,
            'Total Tagihan': data.totalTagihan,
            'Total Bayar': data.totalBayar,
            'Tunggakan': data.tunggakan,
            'Pengeluaran': data.pengeluaran,
            'Saldo': data.saldo,
            '% Tunggakan': data.persenTunggakan,
            '% Bayar': data.persenBayar
        });

        // Sheet 2: Rincian Unit Baru & Lama
        const wsUnitData = [
            { 'Unit': '--- SANTRI BARU ---' },
            mapUnitToRow('PAUDQu', dashboardStats.baru.PAUDQu),
            mapUnitToRow('TPQ', dashboardStats.baru.TPQ),
            mapUnitToRow('MDT', dashboardStats.baru.MDT),
            mapUnitToRow('TOTAL SANTRI BARU', dashboardStats.madrasahBaru),
            { 'Unit': '' },
            { 'Unit': '--- SANTRI DAFTAR ULANG ---' },
            mapUnitToRow('PAUDQu', dashboardStats.lama.PAUDQu),
            mapUnitToRow('TPQ', dashboardStats.lama.TPQ),
            mapUnitToRow('MDT', dashboardStats.lama.MDT),
            mapUnitToRow('TOTAL DAFTAR ULANG', dashboardStats.madrasahLama),
            { 'Unit': '' },
            { 'Unit': '--- KESELURUHAN MADRASAH ---' },
            mapUnitToRow('GRAND TOTAL', dashboardStats.madrasahTotal)
        ];
        const wsUnit = xlsx.utils.json_to_sheet(wsUnitData);
        xlsx.utils.book_append_sheet(wb, wsUnit, 'Rincian Unit');

        // Sheet 3: Rekapitulasi Kelas
        const wsKelasData = [
            { 'Kelas': '--- SANTRI BARU ---', 'Jumlah': '' },
            ...Object.keys(dashboardStats.rekapBaru).map(k => ({ 'Kelas': k, 'Jumlah': dashboardStats.rekapBaru[k] })),
            { 'Kelas': '', 'Jumlah': '' },
            { 'Kelas': '--- SANTRI DAFTAR ULANG ---', 'Jumlah': '' },
            ...Object.keys(dashboardStats.rekapLama).map(k => ({ 'Kelas': k, 'Jumlah': dashboardStats.rekapLama[k] }))
        ];
        const wsKelas = xlsx.utils.json_to_sheet(wsKelasData);
        xlsx.utils.book_append_sheet(wb, wsKelas, 'Rekap Kelas');

        // Sheet 4: Rekapitulasi Pengeluaran
        let wsPengeluaranData = [];
        if (dashboardStats.pengeluaranRekap && dashboardStats.pengeluaranRekap.length > 0) {
            wsPengeluaranData = dashboardStats.pengeluaranRekap.map(p => ({
                'Kategori / Uraian': p.uraian,
                'Total Pengeluaran': p.totalPengeluaran
            }));
        } else {
            wsPengeluaranData = [{ 'Kategori / Uraian': 'Tidak ada data pengeluaran', 'Total Pengeluaran': 0 }];
        }
        const wsPengeluaran = xlsx.utils.json_to_sheet(wsPengeluaranData);
        xlsx.utils.book_append_sheet(wb, wsPengeluaran, 'Rekap Pengeluaran');

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        const filename = startDate && endDate ? `Dashboard_Keuangan_${startDate}_to_${endDate}.xlsx` : `Dashboard_Keuangan_Global.xlsx`;

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error("Error Export Dashboard Excel:", err);
        res.status(500).send('Server Error');
    }
};
