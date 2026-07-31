const db = require('../../config/db');

exports.getLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const [[{ total }]] = await db.execute('SELECT COUNT(*) as total FROM activity_logs');
        const totalPages = Math.ceil(total / limit) || 1;

        const [logs] = await db.execute('SELECT * FROM activity_logs ORDER BY createdAt DESC LIMIT ? OFFSET ?', [limit, offset]);
        
        res.render('superadmin/logs', {
            title: 'Log Aktivitas Sistem',
            logs: logs,
            currentPage: page,
            totalPages: totalPages,
            bodyView: 'logs'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};
