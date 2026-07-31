const express = require('express');
const router = express.Router();

const { checkRole } = require('../middlewares/checkRole');

const userManagementController = require('../controllers/superadmin/userManagementController');
const masterDataController = require('../controllers/superadmin/masterDataController');
const logController = require('../controllers/superadmin/logController');

// --- GEMBOK KEAMANAN SUPER ADMIN ---
// Hanya role 'super_admin' yang bisa mengakses rute ini
router.use(checkRole(['super_admin']));

// Dashboard (Simpel saja, mungkin cuma redirect ke users atau ada summary khusus)
router.get('/dashboard', (req, res) => {
    res.render('superadmin/dashboard', { title: 'Dashboard Super Admin', bodyView: 'dashboard' });
});

// Manajemen Pengguna
router.get('/users', userManagementController.getUsers);
router.post('/users/add', userManagementController.addUser);
router.post('/users/edit/:id', userManagementController.editUser);
router.post('/users/delete/:id', userManagementController.deleteUser);

// Master Data
router.get('/master-data', masterDataController.getMasterData);

router.post('/master-data/jenjang/add', masterDataController.addJenjang);
router.post('/master-data/jenjang/edit/:id', masterDataController.editJenjang);
router.post('/master-data/jenjang/delete/:id', masterDataController.deleteJenjang);

router.post('/master-data/jalur/add', masterDataController.addJalur);
router.post('/master-data/jalur/edit/:id', masterDataController.editJalur);
router.post('/master-data/jalur/delete/:id', masterDataController.deleteJalur);

router.post('/master-data/gelombang/add', masterDataController.addGelombang);
router.post('/master-data/gelombang/edit/:id', masterDataController.editGelombang);
router.post('/master-data/gelombang/delete/:id', masterDataController.deleteGelombang);

// Activity Logs
router.get('/logs', logController.getLogs);

module.exports = router;
