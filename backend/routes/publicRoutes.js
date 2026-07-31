const express = require('express');
const router = express.Router();

const landingController = require('../controllers/public/landingController');
const pendaftaranController = require('../controllers/public/pendaftaranController');
const pembayaranController = require('../controllers/public/pembayaranController');
const apiIntegrationController = require('../controllers/public/apiIntegrationController');
const ssoController = require('../controllers/admin/ssoController');
const { pendaftaranLimiter } = require('../middlewares/rateLimiter');
const { checkRegistrationOpen } = require('../middlewares/checkRegistration');

// Landing Page
router.get('/', landingController.getLanding);

// Form Reguler
router.get('/daftar', checkRegistrationOpen, pendaftaranController.getFormPendaftaran);
router.post('/daftar', checkRegistrationOpen, pendaftaranLimiter, pendaftaranController.postFormPendaftaran);

// Form Daftar Ulang
router.get('/daftar-ulang', checkRegistrationOpen, pendaftaranController.getFormDaftarUlang);
router.post('/daftar-ulang', checkRegistrationOpen, pendaftaranLimiter, pendaftaranController.postFormDaftarUlang);

// Form Beasiswa
router.get('/daftar/beasiswa', checkRegistrationOpen, pendaftaranController.getFormBeasiswa);
router.post('/daftar/beasiswa', checkRegistrationOpen, pendaftaranLimiter, pendaftaranController.postFormBeasiswa);

// Sukses
router.get('/daftar/sukses', landingController.getSukses);

// Info Pembayaran
router.get('/info-pembayaran', pembayaranController.getFormPembayaran);
router.post('/info-pembayaran', pendaftaranLimiter, pembayaranController.cekPembayaran);

// API Integrasi SIKMA
router.get('/api/santri-baru', apiIntegrationController.getSantriBaru);
router.get('/api/tunggakan', apiIntegrationController.getTunggakan);

// SSO Integrasi SIKMA
router.get('/api/sso/login', ssoController.loginFromSikma);

module.exports = router;
