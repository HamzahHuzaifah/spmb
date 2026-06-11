const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Laporan
router.get('/laporan', adminController.getLaporan);

// Tagihan
router.get('/tagihan', adminController.getTagihan);
router.get('/tagihan-daftar-ulang', adminController.getTagihanDaftarUlang);
router.post('/tagihan/edit/:id', adminController.editTagihan);
router.post('/tagihan-daftar-ulang/edit/:id', adminController.editTagihanDaftarUlang);

// Tunggakan
router.get('/tunggakan', adminController.getTunggakan);
router.get('/tunggakan-daftar-ulang', adminController.getTunggakanDaftarUlang);

// Santri
router.get('/santri', adminController.getSantri);
router.get('/santri-daftar-ulang', adminController.getSantriDaftarUlang);
router.post('/santri/edit/:id', adminController.editSantri);
router.post('/santri-daftar-ulang/edit/:id', adminController.editSantriDaftarUlang);
router.post('/santri/delete/:id', adminController.deleteSantri);
router.post('/santri-daftar-ulang/delete/:id', adminController.deleteSantriDaftarUlang);

// Input Transaksi
router.get('/input-transaksi', adminController.getInputTransaksi);
router.post('/input-transaksi', adminController.postInputTransaksi);
router.post('/input-transaksi/edit/:id', adminController.editTransaksi);
router.post('/input-transaksi/delete/:id', adminController.deleteTransaksi);

// Kwitansi
router.get('/kwitansi/:id', adminController.getKwitansi);
router.post('/kwitansi/edit/:id', adminController.editKwitansiDetail);

module.exports = router;
