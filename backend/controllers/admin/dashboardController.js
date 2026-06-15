const SantriModel = require('../../models/SantriModel');
const TagihanModel = require('../../models/TagihanModel');
const TunggakanModel = require('../../models/TunggakanModel');
const TransaksiModel = require('../../models/TransaksiModel');

exports.getDashboard = async (req, res) => {
    try {
        const santriData = await SantriModel.getAllSantri();
        const santriDaftarUlangData = await SantriModel.getAllSantriDaftarUlang();
        const tagihanData = await TagihanModel.getAllTagihan();
        const tagihanDaftarUlangData = await TagihanModel.getAllTagihanDaftarUlang();
        const tunggakanData = await TunggakanModel.getAllTunggakan();
        const tunggakanDaftarUlangData = await TunggakanModel.getAllTunggakanDaftarUlang();
        
        // Paginasi tabel transaksi terbaru
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        const filterTanggal = { start: startDate, end: endDate };
        
        // Ambil transaksi terbaru untuk tabel sesuai pagination
        const transaksiTerbaru = await TransaksiModel.getTransaksiPaginated(limit, offset, '', filterTanggal, '');
        const totalData = await TransaksiModel.getTotalTransaksi('', filterTanggal, '');
        const totalPages = Math.ceil(totalData / limit);

        // === Aggregate Data for Dashboard ===
        
        // 1. Grand Totals (Sebelum Subsidi Ziswaf)
        const targetPendapatanBaruNoZiswaf = tagihanData.reduce((sum, item) => sum + item.totalTagihan, 0);
        const targetPendapatanLamaNoZiswaf = tagihanDaftarUlangData.reduce((sum, item) => sum + item.totalTagihan, 0);
        
        // Hitung Santri Beasiswa Dhuafa / Yatim
        const countBeasiswaBaru = santriData.filter(s => s.jalurPendaftaran === 'Beasiswa Dhuafa' || s.jalurPendaftaran === 'Beasiswa Yatim/Piatu').length;
        const countBeasiswaLama = santriDaftarUlangData.filter(s => s.jalurPendaftaran === 'Beasiswa Dhuafa' || s.jalurPendaftaran === 'Beasiswa Yatim/Piatu').length;
        
        const totalSantriBeasiswa = countBeasiswaBaru + countBeasiswaLama;
        const targetDanaZiswaf = totalSantriBeasiswa * 150000;
        
        // Hitung Realisasi dari Pemasukan dengan kata kunci "ziswaf" (Dari SQL)
        const realisasiZiswaf = await TransaksiModel.getRealisasiZiswafGlobal();
        
        const tunggakanZiswaf = Math.max(0, targetDanaZiswaf - realisasiZiswaf);
        
        // Total Target & Tunggakan setelah digabung dengan Ziswaf
        const totalTargetPendapatan = targetPendapatanBaruNoZiswaf + targetPendapatanLamaNoZiswaf + targetDanaZiswaf;
        
        const tunggakanBaruNoZiswaf = tunggakanData.reduce((sum, item) => sum + item.sisaBayar, 0);
        const tunggakanLamaNoZiswaf = tunggakanDaftarUlangData.reduce((sum, item) => sum + item.sisaBayar, 0);
        const totalTunggakan = tunggakanBaruNoZiswaf + tunggakanLamaNoZiswaf + tunggakanZiswaf;
        
        // Total Pemasukan riil global (Dari SQL)
        const totalPemasukanGlobal = await TransaksiModel.getTotalPemasukanGlobal();

        // Helper for grouping (async karena panggil SQL)
        const getUnitStats = async (unitPrefix, tghData, tggData, isBaru) => {
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
            
            // Realisasi Ziswaf per unit (Dari SQL)
            let realisasiZiswafUnit = await TransaksiModel.getRealisasiZiswafByUnit(unitPrefix, isBaru);
            
            let tunggakanZiswafUnit = Math.max(0, targetZiswafUnit - realisasiZiswafUnit);
            
            let totalTagihan = tagihanGroup.reduce((sum, item) => sum + item.totalTagihan, 0) + targetZiswafUnit;
            let totalBayar = tunggakanGroup.reduce((sum, item) => sum + item.totalBayar, 0) + realisasiZiswafUnit;
            let tunggakan = tunggakanGroup.reduce((sum, item) => sum + item.sisaBayar, 0) + tunggakanZiswafUnit;
            let pengeluaran = 0;
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
        const baruPAUDQu = await getUnitStats('PAUDQu', tagihanData, tunggakanData, true);
        const baruTPQ = await getUnitStats('TPQ', tagihanData, tunggakanData, true);
        const baruMDT = await getUnitStats('MDT', tagihanData, tunggakanData, true);

        // Unit Specific Stats (Lama / Daftar Ulang)
        const lamaPAUDQu = await getUnitStats('PAUDQu', tagihanDaftarUlangData, tunggakanDaftarUlangData, false);
        const lamaTPQ = await getUnitStats('TPQ', tagihanDaftarUlangData, tunggakanDaftarUlangData, false);
        const lamaMDT = await getUnitStats('MDT', tagihanDaftarUlangData, tunggakanDaftarUlangData, false);

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
            pengeluaran: 0, 
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

        // 4. Rekapitulasi Pengeluaran (Dari SQL)
        const pengeluaranRekap = await TransaksiModel.getPengeluaranRekap();

        res.render('dashboard', { 
            data: { transaksiTerbaru }, // Needed by table mapping
            currentPage: page,
            totalPages: totalPages,
            totalData: totalData,
            startDateQuery: startDate,
            endDateQuery: endDate,
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
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
