const db = require('../config/db');

class SystemSettingModel {
    static async getSetting(key) {
        const [rows] = await db.execute('SELECT `value` FROM `system_settings` WHERE `key` = ?', [key]);
        if (rows.length > 0) {
            return rows[0].value;
        }
        return null;
    }

    static async setSetting(key, value) {
        // Check if exists
        const [rows] = await db.execute('SELECT id FROM `system_settings` WHERE `key` = ?', [key]);
        if (rows.length > 0) {
            await db.execute('UPDATE `system_settings` SET `value` = ? WHERE `key` = ?', [value, key]);
        } else {
            await db.execute('INSERT INTO `system_settings` (`key`, `value`) VALUES (?, ?)', [key, value]);
        }
    }
}

module.exports = SystemSettingModel;
