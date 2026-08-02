const SystemSettingModel = require('../../models/SystemSetting');
const logger = require('../../utils/logger');

exports.toggleTutupBuku = async (req, res) => {
    try {
        const { status } = req.body; // boolean
        
        await SystemSettingModel.setSetting('TUTUP_BUKU', status ? 'true' : 'false');
        
        logger.info(`Superadmin toggled TUTUP_BUKU to: ${status}`);
        res.json({ success: true, message: 'Status Tutup Buku berhasil diubah' });
    } catch (error) {
        logger.error('Error toggling Tutup Buku: ' + error.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
