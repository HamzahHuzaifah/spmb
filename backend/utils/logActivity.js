const db = require('../config/db');

/**
 * Mencatat aktivitas pengguna ke dalam tabel activity_logs
 * @param {Object} req - Express request object (harus memiliki req.admin dan req.ip)
 * @param {String} action - Deskripsi aktivitas (contoh: "Update Master Jenjang")
 * @param {String} target_table - Tabel yang terpengaruh (opsional)
 * @param {Number} target_id - ID dari baris yang terpengaruh (opsional)
 * @param {String} details - Detail tambahan dalam format string/JSON (opsional)
 */
const logActivity = async (req, action, target_table = null, target_id = null, details = null) => {
    try {
        const user_id = req.admin ? req.admin.id : null;
        const username = req.admin ? req.admin.username : 'System';
        const role = req.admin ? req.admin.role : 'System';
        const ip_address = req.ip || req.connection.remoteAddress;
        const user_agent = req.headers['user-agent'] || 'Unknown';

        await db.execute(
            `INSERT INTO activity_logs 
            (user_id, username, role, action, target_table, target_id, details, ip_address, user_agent) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, username, role, action, target_table, target_id, details, ip_address, user_agent]
        );
    } catch (err) {
        console.error('[ActivityLog] Gagal menyimpan log aktivitas:', err.message);
    }
};

module.exports = { logActivity };
