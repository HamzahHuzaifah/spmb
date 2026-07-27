const express = require('express');
const router = express.Router();

const landingController = require('../controllers/public/landingController');
const pendaftaranController = require('../controllers/public/pendaftaranController');
const pembayaranController = require('../controllers/public/pembayaranController');
const apiIntegrationController = require('../controllers/public/apiIntegrationController');
const { pendaftaranLimiter } = require('../middlewares/rateLimiter');

// Landing Page
router.get('/', landingController.getLanding);

// Form Reguler
router.get('/daftar', pendaftaranController.getFormPendaftaran);
router.post('/daftar', pendaftaranLimiter, pendaftaranController.postFormPendaftaran);

// Form Daftar Ulang
router.get('/daftar-ulang', pendaftaranController.getFormDaftarUlang);
router.post('/daftar-ulang', pendaftaranLimiter, pendaftaranController.postFormDaftarUlang);

// Form Beasiswa
router.get('/daftar/beasiswa', pendaftaranController.getFormBeasiswa);
router.post('/daftar/beasiswa', pendaftaranLimiter, pendaftaranController.postFormBeasiswa);

// Sukses
router.get('/daftar/sukses', landingController.getSukses);

// Info Pembayaran
router.get('/info-pembayaran', pembayaranController.getFormPembayaran);
router.post('/info-pembayaran', pendaftaranLimiter, pembayaranController.cekPembayaran);

// API Integrasi SIKMA
router.get('/api/santri-baru', apiIntegrationController.getSantriBaru);

module.exports = router;
