const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Landing Page
router.get('/', publicController.getLandingPage);

// Form Reguler
router.get('/daftar', publicController.getFormReguler);
router.post('/daftar', publicController.postFormReguler);

// Form Daftar Ulang
router.get('/daftar-ulang', publicController.getFormDaftarUlang);
router.post('/daftar-ulang', publicController.postFormDaftarUlang);

// Form Beasiswa
router.get('/daftar/beasiswa', publicController.getFormBeasiswa);
router.post('/daftar/beasiswa', publicController.postFormBeasiswa);

// Sukses
router.get('/daftar/sukses', publicController.getSukses);

module.exports = router;
