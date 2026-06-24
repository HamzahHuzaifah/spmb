const express = require('express');
const router = express.Router();

const authController = require('../controllers/admin/authController');
const { cekAuth } = require('../middlewares/auth');

const dashboardController = require('../controllers/admin/dashboardController');
const laporanController = require('../controllers/admin/laporanController');
const tagihanController = require('../controllers/admin/tagihanController');
const tunggakanController = require('../controllers/admin/tunggakanController');
const santriController = require('../controllers/admin/santriController');
const transaksiController = require('../controllers/admin/transaksiController');
const kwitansiController = require('../controllers/admin/kwitansiController');

// --- Autentikasi Admin ---
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.getLogout);

// --- GEMBOK KEAMANAN ---
// Semua rute yang tertulis di bawah baris ini akan diperiksa oleh satpam 'cekAuth'
router.use(cekAuth);

// Dashboard
router.get('/dashboard', dashboardController.getDashboard);

// Laporan
router.get('/laporan', laporanController.getLaporan);
router.get('/laporan-bulanan', laporanController.getLaporanBulanan);

// Tagihan
router.get('/tagihan', tagihanController.getTagihan);
router.get('/tagihan-daftar-ulang', tagihanController.getTagihanDaftarUlang);
router.post('/tagihan/edit/:id', tagihanController.editTagihan);
router.post('/tagihan-daftar-ulang/edit/:id', tagihanController.editTagihanDaftarUlang);

// Tunggakan
router.get('/tunggakan', tunggakanController.getTunggakan);
router.get('/tunggakan-daftar-ulang', tunggakanController.getTunggakanDaftarUlang);

// Santri
router.get('/santri', santriController.getSantri);
router.get('/santri-daftar-ulang', santriController.getSantriDaftarUlang);
router.post('/santri/edit/:id', santriController.editSantri);
router.post('/santri-daftar-ulang/edit/:id', santriController.editSantriDaftarUlang);
router.post('/santri/delete/:id', santriController.deleteSantri);
router.post('/santri-daftar-ulang/delete/:id', santriController.deleteSantriDaftarUlang);

// Input Transaksi
router.get('/input-transaksi', transaksiController.getInputTransaksi);
router.post('/input-transaksi', transaksiController.postInputTransaksi);
router.post('/input-transaksi/edit/:id', transaksiController.editTransaksi);
router.post('/input-transaksi/delete/:id', transaksiController.deleteTransaksi);

// API AJAX
router.get('/api/search-santri', transaksiController.apiSearchTunggakan);

// Kwitansi
router.get('/kwitansi/:id', kwitansiController.getKwitansi);
router.post('/kwitansi/edit/:id', kwitansiController.editKwitansiDetail);

module.exports = router;
