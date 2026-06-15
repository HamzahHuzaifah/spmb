const express = require('express');
const router = express.Router();

const landingController = require('../controllers/public/landingController');
const pendaftaranController = require('../controllers/public/pendaftaranController');
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

module.exports = router;
